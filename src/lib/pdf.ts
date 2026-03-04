import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

async function getBrowser() {
  const isServerless = process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL;

  const extraArgs = [
    '--force-color-profile=srgb',
    '--disable-web-security',
    '--allow-running-insecure-content',
  ];

  if (isServerless) {
    const executablePath = await chromium.executablePath();
    return puppeteer.launch({
      args: [...chromium.args, ...extraArgs],
      defaultViewport: { width: 794, height: 1123 },
      executablePath,
      headless: true,
    });
  } else {
    const executablePath =
      process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : process.platform === 'win32'
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : '/usr/bin/google-chrome';

    return puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', ...extraArgs],
    });
  }
}

const PRINT_FIX_CSS = `
  html, body, div, td, th, tr, table {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
`;

export async function generatePdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.emulateMediaType('screen');
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.addStyleTag({ content: PRINT_FIX_CSS });
    await page.evaluate(() => document.fonts?.ready);

    // Wait for images
    await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true });
                img.addEventListener('error', () => resolve(), { once: true });
                setTimeout(resolve, 5000);
              })
        )
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
