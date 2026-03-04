import { NextRequest, NextResponse } from 'next/server';
import { generatePdf } from '@/lib/pdf';
import { TenderAnalysis, FIELD_LABELS, DATE_LABELS } from '@/lib/types';
import fs from 'fs';
import path from 'path';

export const maxDuration = 120;

function stringify(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(stringify).join('\n');
  if (typeof val === 'object') {
    return Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${stringify(v)}`)
      .join('\n');
  }
  return String(val);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
}

interface RowData {
  label: string;
  value: string;
  isSection: boolean;
}

function getAllRows(data: TenderAnalysis): RowData[] {
  const rows: RowData[] = [];
  rows.push({ label: FIELD_LABELS.tenderName, value: stringify(data.tenderName), isSection: false });

  const mainFields = Object.entries(FIELD_LABELS).filter(([key]) => key !== 'tenderName');

  for (const [key, label] of mainFields.slice(0, 10)) {
    rows.push({ label, value: stringify(data[key as keyof TenderAnalysis]), isSection: false });
  }

  rows.push({ label: 'מועדים רלוונטיים', value: '', isSection: true });
  for (const [key, label] of Object.entries(DATE_LABELS)) {
    rows.push({ label, value: stringify(data.relevantDates?.[key as keyof typeof data.relevantDates]), isSection: false });
  }

  rows.push({ label: 'דרישות וצוות', value: '', isSection: true });
  for (const [key, label] of mainFields.slice(10, 16)) {
    rows.push({ label, value: stringify(data[key as keyof TenderAnalysis]), isSection: false });
  }

  rows.push({ label: 'תמורה ואיכות', value: '', isSection: true });
  for (const [key, label] of mainFields.slice(16, 22)) {
    rows.push({ label, value: stringify(data[key as keyof TenderAnalysis]), isSection: false });
  }

  rows.push({ label: 'מסמכים, פורמט וקנסות', value: '', isSection: true });
  for (const [key, label] of mainFields.slice(22)) {
    rows.push({ label, value: stringify(data[key as keyof TenderAnalysis]), isSection: false });
  }

  return rows;
}

function getLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch {
    return '';
  }
}

function buildPdfHtml(data: TenderAnalysis): string {
  const logoSrc = getLogoBase64();
  const rows = getAllRows(data);
  const tableRows = rows
    .map((row, i) => {
      if (row.isSection) {
        return `<tr><td colspan="2" style="background:#0d7377;color:white;padding:10px 14px;font-weight:bold;font-size:13px;border:1px solid #095456;">${escapeHtml(row.label)}</td></tr>`;
      }
      const bg = i % 2 === 0 ? '#f8fafa' : '#ffffff';
      const val = row.value
        ? escapeHtml(row.value)
        : '<span style="color:#bbb;font-style:italic;">לא צוין במסמך</span>';
      return `<tr style="background:${bg};">
      <td style="padding:9px 14px;font-weight:600;color:#0d7377;vertical-align:top;border:1px solid #e5e7eb;width:28%;">${escapeHtml(row.label)}</td>
      <td style="padding:9px 14px;color:#333;vertical-align:top;border:1px solid #e5e7eb;line-height:1.6;">${val}</td>
    </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans Hebrew', 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      padding: 0;
      color: #333;
      background: #fff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      page-break-inside: auto;
    }
    tr { page-break-inside: avoid; page-break-after: auto; }
    td { word-wrap: break-word; }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 0 16px 0;border-bottom:3px solid #0d7377;margin-bottom:20px;">
    <div>
      <h1 style="color:#0d7377;font-size:24px;margin:0;font-weight:700;">ניתוח מכרז</h1>
      <p style="color:#666;font-size:12px;margin-top:6px;">${escapeHtml(stringify(data.tenderName).substring(0, 120))}</p>
    </div>
    ${logoSrc ? `<img src="${logoSrc}" style="height:45px;object-fit:contain;"/>` : ''}
  </div>
  <table>
    <thead>
      <tr style="background:#0d7377;">
        <th style="color:white;padding:10px 14px;text-align:right;width:28%;border:1px solid #095456;font-size:12px;">נושא</th>
        <th style="color:white;padding:10px 14px;text-align:right;border:1px solid #095456;font-size:12px;">פירוט</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div style="margin-top:20px;padding-top:10px;border-top:2px solid #0d7377;text-align:center;color:#888;font-size:9px;">
    פורן שרם - ניהול פרויקטים, הנדסה, פיקוח | מופעל על ידי Claude AI
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const { data } = (await request.json()) as { data: TenderAnalysis };

    if (!data) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const html = buildPdfHtml(data);
    const pdfBuffer = await generatePdf(html);

    const fileName = `ניתוח_מכרז_${stringify(data.tenderName).substring(0, 50) || 'מסמך'}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error('[export-pdf] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
