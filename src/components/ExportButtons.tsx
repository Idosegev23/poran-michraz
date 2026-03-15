'use client';

import { TenderAnalysis, FIELD_LABELS, DATE_LABELS } from '@/lib/types';
import { useState } from 'react';

interface ExportButtonsProps {
  data: TenderAnalysis;
}

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

function buildPdfElement(data: TenderAnalysis): HTMLDivElement {
  const rows = getAllRows(data);
  const tableRows = rows
    .map((row, i) => {
      if (row.isSection) {
        return `<tr><td colspan="2" style="background:#0d7377;color:#fff;padding:10px 14px;font-weight:bold;font-size:13px;border:1px solid #095456;">${escapeHtml(row.label)}</td></tr>`;
      }
      const bg = i % 2 === 0 ? '#f0f7f7' : '#ffffff';
      const val = row.value
        ? escapeHtml(row.value)
        : '<span style="color:#999;font-style:italic;">לא צוין במסמך</span>';
      return `<tr style="background:${bg};">
      <td style="padding:9px 14px;font-weight:600;color:#0a5c5f;vertical-align:top;border:1px solid #d0d5dd;width:28%;background:#e6f0f0;">${escapeHtml(row.label)}</td>
      <td style="padding:9px 14px;color:#222;vertical-align:top;border:1px solid #d0d5dd;line-height:1.7;">${val}</td>
    </tr>`;
    })
    .join('');

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;direction:rtl;font-family:Arial,Tahoma,sans-serif;color:#222;background:#fff;padding:20px;';
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:0 0 16px 0;border-bottom:3px solid #0d7377;margin-bottom:20px;">
      <div>
        <h1 style="color:#0d7377;font-size:22px;font-weight:700;">ניתוח מכרז</h1>
        <p style="color:#666;font-size:12px;margin-top:6px;">${escapeHtml(stringify(data.tenderName).substring(0, 120))}</p>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:11.5px;">
      <thead>
        <tr style="background:#0d7377;">
          <th style="color:#fff;padding:10px 14px;text-align:right;width:28%;border:1px solid #095456;font-size:12px;">נושא</th>
          <th style="color:#fff;padding:10px 14px;text-align:right;border:1px solid #095456;font-size:12px;">פירוט</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div style="margin-top:20px;padding-top:10px;border-top:2px solid #0d7377;text-align:center;color:#888;font-size:9px;">
      פורן שרם - ניהול פרויקטים, הנדסה, פיקוח | מופעל על ידי Claude AI
    </div>
  `;

  return container;
}

async function exportToPDF(data: TenderAnalysis, setGenerating: (v: boolean) => void) {
  try {
    setGenerating(true);

    const html2pdf = (await import('html2pdf.js')).default;

    const element = buildPdfElement(data);
    document.body.appendChild(element);

    // Wait for fonts to load
    await document.fonts?.ready;
    await new Promise(r => setTimeout(r, 300));

    const filename = `ניתוח_מכרז_${stringify(data.tenderName).substring(0, 40) || 'מסמך'}.pdf`;

    await html2pdf()
      .set({
        margin: [8, 6, 8, 6],
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(element)
      .save();

    document.body.removeChild(element);
  } catch {
    alert('שגיאה ביצירת PDF. נסה שוב.');
  } finally {
    setGenerating(false);
  }
}

async function exportToExcel(data: TenderAnalysis) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('ניתוח מכרז', {
    views: [{ rightToLeft: true }],
  });

  try {
    const logoResponse = await fetch('/logo.png');
    const logoBuffer = await logoResponse.arrayBuffer();
    const logoId = workbook.addImage({ buffer: logoBuffer, extension: 'png' });
    worksheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 200, height: 64 } });
  } catch { /* continue */ }

  worksheet.getRow(1).height = 50;
  worksheet.getRow(2).height = 10;

  worksheet.mergeCells('A3:B3');
  const titleCell = worksheet.getCell('A3');
  titleCell.value = `ניתוח מכרז - ${stringify(data.tenderName)}`;
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF0D7377' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(3).height = 35;
  worksheet.getRow(4).height = 5;

  const headerRow = worksheet.getRow(5);
  headerRow.values = ['נושא', 'פירוט'];
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D7377' } };
    cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF095456' } },
      bottom: { style: 'thin', color: { argb: 'FF095456' } },
      left: { style: 'thin', color: { argb: 'FF095456' } },
      right: { style: 'thin', color: { argb: 'FF095456' } },
    };
  });

  const rows = getAllRows(data);
  let isAlternate = false;
  let currentRow = 6;

  for (const rowData of rows) {
    const row = worksheet.getRow(currentRow);
    if (rowData.isSection) {
      row.values = [rowData.label, ''];
      row.height = 28;
      row.eachCell((cell) => {
        cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D7377' } };
        cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
        cell.border = { top: { style: 'thin', color: { argb: 'FF095456' } }, bottom: { style: 'thin', color: { argb: 'FF095456' } }, left: { style: 'thin', color: { argb: 'FF095456' } }, right: { style: 'thin', color: { argb: 'FF095456' } } };
      });
    } else {
      row.values = [rowData.label, rowData.value];
      row.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: 'right', vertical: 'top', wrapText: true };
        cell.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
        if (colNumber === 1) {
          cell.font = { bold: true, size: 10, color: { argb: 'FF0D7377' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F0F0' } };
        } else {
          cell.font = { size: 10 };
          if (isAlternate) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F5F5' } };
        }
      });
      isAlternate = !isAlternate;
    }
    currentRow++;
  }

  worksheet.getColumn(1).width = 45;
  worksheet.getColumn(2).width = 80;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ניתוח_מכרז_${stringify(data.tenderName) || 'מסמך'}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

async function shareAnalysis(
  data: TenderAnalysis,
  setShareUrl: (url: string | null) => void,
  setShareLoading: (v: boolean) => void
) {
  setShareLoading(true);
  try {
    // Try server-side storage for short URL
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const { id } = await res.json();
      const shortUrl = `${window.location.origin}/analysis/shared?id=${id}`;
      await navigator.clipboard.writeText(shortUrl);
      setShareUrl(shortUrl);
    } else {
      throw new Error('API failed');
    }
  } catch {
    // Fallback: compressed URL
    const pako = (await import('pako')).default;
    const jsonStr = JSON.stringify(data);
    const compressed = pako.deflate(new TextEncoder().encode(jsonStr));
    const b64 = btoa(String.fromCharCode(...compressed))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const longUrl = `${window.location.origin}/analysis/shared?z=${b64}`;
    try { await navigator.clipboard.writeText(longUrl); } catch { /* */ }
    setShareUrl(longUrl);
  } finally {
    setShareLoading(false);
  }
}

export default function ExportButtons({ data }: ExportButtonsProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleShare = () => {
    shareAnalysis(data, setShareUrl, setShareLoading);
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => exportToPDF(data, setGeneratingPdf)}
          disabled={generatingPdf}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
            generatingPdf
              ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-wait'
              : 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
          }`}
        >
          {generatingPdf ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {generatingPdf ? 'מייצר...' : 'PDF'}
        </button>

        <button
          onClick={() => exportToExcel(data)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Excel
        </button>

        <button
          onClick={handleShare}
          disabled={shareLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
            shareLoading
              ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-wait'
              : 'text-teal-700 bg-teal-50 hover:bg-teal-100 border-teal-200'
          }`}
        >
          {shareLoading ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          )}
          שתף
        </button>
      </div>

      {/* Share dialog */}
      {shareUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4" onClick={() => setShareUrl(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">קישור לשיתוף</h3>
              <button onClick={() => setShareUrl(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 select-all"
                onFocus={e => e.target.select()}
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  justCopied
                    ? 'bg-teal-500 text-white'
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                }`}
              >
                {justCopied ? 'הועתק!' : 'העתק'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">הקישור הועתק ללוח. שתף אותו עם הצוות.</p>
          </div>
        </div>
      )}
    </>
  );
}
