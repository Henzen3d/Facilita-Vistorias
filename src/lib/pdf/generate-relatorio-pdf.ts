import puppeteer from "puppeteer";

export type GenerateRelatorioPdfOpts = {
  /** Full public report URL (prefer with ?print=1 for full layout). */
  publicUrl: string;
  /** Optional raw HTML if APP_URL is unreachable — rarely used. */
  html?: string;
};

/**
 * Renders the public report page (or provided HTML) to an A4 PDF buffer via Puppeteer.
 * Docker-friendly launch args: --no-sandbox --disable-setuid-sandbox.
 */
export async function generateRelatorioPdfBuffer(
  opts: GenerateRelatorioPdfOpts,
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 });

    if (opts.html) {
      await page.setContent(opts.html, { waitUntil: "networkidle0" });
    } else {
      const url = opts.publicUrl.includes("print=")
        ? opts.publicUrl
        : `${opts.publicUrl}${opts.publicUrl.includes("?") ? "&" : "?"}print=1`;
      await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 120_000,
      });
    }

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close().catch(() => undefined);
  }
}
