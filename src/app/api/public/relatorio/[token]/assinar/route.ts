import { NextRequest, NextResponse } from "next/server";
import { StatusRelatorio } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { enqueueGeneratePdf } from "@/lib/queue/queues";
import { cpfUltimos3, isValidCpf, stripCpf } from "@/lib/report/cpf";
import {
  buildAssinaturaHash,
  canAssinarRelatorio,
  extractClientIp,
  isValidAssinaturaBase64,
  normalizeAssinaturaImage,
  summarizeUserAgent,
} from "@/lib/report/signature";
import { verifyPublicReportToken } from "@/lib/report/token";

const bodySchema = z.object({
  nomeCompleto: z.string().min(2).max(120),
  cpf: z.string().min(11).max(18),
  assinaturaBase64: z.string().min(100),
  aceite: z.literal(true),
});

/**
 * POST /api/public/relatorio/[token]/assinar
 * Electronic signature with audit trail (Phase 5).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const verified = await verifyPublicReportToken(token);
    if (!verified) {
      return NextResponse.json(
        { error: "Link inválido ou relatório não encontrado" },
        { status: 404 },
      );
    }

    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { nomeCompleto, cpf, assinaturaBase64 } = parsed.data;
    const cpfDigits = stripCpf(cpf);

    if (!isValidCpf(cpfDigits)) {
      return NextResponse.json(
        { error: "CPF inválido", code: "CPF_INVALID" },
        { status: 400 },
      );
    }

    if (!isValidAssinaturaBase64(assinaturaBase64)) {
      return NextResponse.json(
        {
          error: "Assinatura inválida — desenhe a assinatura no quadro",
          code: "ASSINATURA_INVALID",
        },
        { status: 400 },
      );
    }

    const gate = await canAssinarRelatorio(verified.vistoriaId);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.reason ?? "Não é possível assinar" },
        { status: 400 },
      );
    }

    const rel = await prisma.relatorio.findUnique({
      where: { vistoriaId: verified.vistoriaId },
    });
    if (!rel) {
      return NextResponse.json(
        { error: "Relatório ainda não gerado" },
        { status: 404 },
      );
    }

    const now = new Date();
    const timestampIso = now.toISOString();
    const assinaturaHash = buildAssinaturaHash({
      relatorioId: rel.id,
      token,
      timestampIso,
      nomeCompleto,
    });
    const cpfHash = await hash(cpfDigits, 10);
    const ip = extractClientIp(request.headers);
    const device = summarizeUserAgent(request.headers.get("user-agent"));
    const imagem = normalizeAssinaturaImage(assinaturaBase64);

    const updated = await prisma.relatorio.update({
      where: { id: rel.id },
      data: {
        assinadoEm: now,
        assinaturaImagem: imagem,
        assinaturaHash,
        assinaturaIp: ip,
        assinaturaDevice: device,
        assinaturaNome: nomeCompleto.trim(),
        assinaturaCpfHash: cpfHash,
        assinaturaCpfUltimos: cpfUltimos3(cpfDigits),
        status: StatusRelatorio.ASSINADA,
      },
    });

    // Re-generate PDF with audit page (worker preserves ASSINADA status)
    try {
      await enqueueGeneratePdf({
        vistoriaId: verified.vistoriaId,
        motivo: "Regeneração pós-assinatura eletrônica",
      });
    } catch (enqueueErr) {
      console.warn(
        "[assinar] PDF enqueue failed (signature saved):",
        enqueueErr instanceof Error ? enqueueErr.message : enqueueErr,
      );
    }

    return NextResponse.json({
      success: true,
      assinadoEm: updated.assinadoEm?.toISOString(),
      assinaturaHash: updated.assinaturaHash,
      assinaturaNome: updated.assinaturaNome,
      auditUrl: `/public/r/${token}/audit`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("assinar public:", error);
    return NextResponse.json(
      { error: "Erro ao registrar assinatura", details: message },
      { status: 500 },
    );
  }
}
