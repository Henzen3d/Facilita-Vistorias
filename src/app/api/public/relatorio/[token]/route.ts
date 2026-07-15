import { NextRequest, NextResponse } from "next/server";
import { loadPublicReportByToken } from "@/lib/report/load-public-report";

/**
 * Public JSON API for report DTO — token-gated, no session auth.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const report = await loadPublicReportByToken(token);

    if (!report) {
      return NextResponse.json(
        { error: "Relatório não encontrado ou link expirado" },
        { status: 404 },
      );
    }

    return NextResponse.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Erro ao carregar relatório público:", error);
    return NextResponse.json(
      { error: "Erro ao carregar relatório", details: message },
      { status: 500 },
    );
  }
}
