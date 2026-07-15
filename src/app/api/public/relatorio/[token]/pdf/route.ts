import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPublicReportToken } from "@/lib/report/token";
import { getStorageProvider } from "@/lib/storage";

/**
 * Streams the generated PDF for a valid public token.
 * Supports local public/relatorios fallback and S3/R2 storage keys.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const verified = await verifyPublicReportToken(token);
    if (!verified) {
      return NextResponse.json(
        { error: "Relatório não encontrado ou link expirado" },
        { status: 404 },
      );
    }

    const relatorio = await prisma.relatorio.findUnique({
      where: { vistoriaId: verified.vistoriaId },
      select: { pdfStorageKey: true, versaoAtual: true },
    });

    if (!relatorio?.pdfStorageKey) {
      return NextResponse.json(
        { error: "PDF ainda não disponível" },
        { status: 404 },
      );
    }

    const key = relatorio.pdfStorageKey;
    let buffer: Buffer;

    if (key.startsWith("local:")) {
      const relPath = key.replace(/^local:/, "");
      const abs = path.join(process.cwd(), "public", relPath.replace(/^\//, ""));
      buffer = await fs.readFile(abs);
    } else {
      // Fetch via signed URL from storage
      const storage = getStorageProvider();
      const signed = await storage.getSignedUrl(key, 120);
      const res = await fetch(signed);
      if (!res.ok) {
        return NextResponse.json(
          { error: "Falha ao obter PDF do storage" },
          { status: 502 },
        );
      }
      buffer = Buffer.from(await res.arrayBuffer());
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-fotografico-v${relatorio.versaoAtual}.pdf"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Erro ao servir PDF público:", error);
    return NextResponse.json(
      { error: "Erro ao baixar PDF", details: message },
      { status: 500 },
    );
  }
}
