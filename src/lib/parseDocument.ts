import mammoth from 'mammoth';

export async function parseDocument(file: Buffer, fileName: string): Promise<string> {
  const extension = fileName.toLowerCase().split('.').pop();

  if (extension === 'pdf') {
    return parsePDF(file);
  } else if (extension === 'docx' || extension === 'doc') {
    return parseWord(file);
  } else {
    throw new Error('סוג קובץ לא נתמך. אנא העלה קובץ PDF או Word (.docx)');
  }
}

async function parsePDF(buffer: Buffer): Promise<string> {
  // Import the core lib directly to avoid pdf-parse's test file loading
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buf: Buffer) => Promise<{ text: string }>;
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseWord(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
