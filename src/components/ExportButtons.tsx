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

async function exportToPDF(data: TenderAnalysis) {
  const rows = getAllRows(data);

  // Build an HTML document for PDF rendering with proper Hebrew
  const html = `
    <div style="direction: rtl; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 15px; border-bottom: 3px solid #0d7377;">
        <div>
          <h1 style="color: #0d7377; margin: 0; font-size: 24px;">ניתוח מכרז</h1>
          <p style="color: #666; margin: 5px 0 0 0; font-size: 13px;">${stringify(data.tenderName) || ''}</p>
        </div>
        <img src="/logo.png" style="height: 45px; object-fit: contain;" />
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px;">
        <thead>
          <tr style="background: #0d7377;">
            <th style="color: white; padding: 10px 12px; text-align: right; width: 30%; border: 1px solid #095456;">נושא</th>
            <th style="color: white; padding: 10px 12px; text-align: right; border: 1px solid #095456;">פירוט</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, i) => {
            if (row.isSection) {
              return `<tr><td colspan="2" style="background: #0d7377; color: white; padding: 8px 12px; font-weight: bold; font-size: 13px; border: 1px solid #095456;">${row.label}</td></tr>`;
            }
            const bg = i % 2 === 0 ? '#f8fafa' : '#ffffff';
            const val = row.value ? row.value.replace(/\n/g, '<br/>') : '<span style="color: #ccc;">לא רלוונטי</span>';
            return `<tr style="background: ${bg};">
              <td style="padding: 8px 12px; font-weight: 600; color: #0d7377; vertical-align: top; border: 1px solid #e5e7eb; width: 30%;">${row.label}</td>
              <td style="padding: 8px 12px; color: #333; vertical-align: top; border: 1px solid #e5e7eb; white-space: pre-wrap;">${val}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center; color: #999; font-size: 10px;">
        פורן שרם - ניהול פרויקטים, הנדסה, פיקוח | מופעל על ידי Claude AI
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  const html2pdf = (await import('html2pdf.js')).default;

  await html2pdf()
    .set({
      margin: [10, 5, 15, 5],
      filename: `ניתוח_מכרז_${stringify(data.tenderName) || 'מסמך'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    })
    .from(container)
    .save();

  document.body.removeChild(container);
}

async function exportToExcel(data: TenderAnalysis) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('ניתוח מכרז', {
    views: [{ rightToLeft: true }],
  });

  // Logo
  try {
    const logoResponse = await fetch('/logo.png');
    const logoBuffer = await logoResponse.arrayBuffer();
    const logoId = workbook.addImage({
      buffer: logoBuffer,
      extension: 'png',
    });
    worksheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 200, height: 64 },
    });
  } catch {
    // continue
  }

  worksheet.getRow(1).height = 50;
  worksheet.getRow(2).height = 10;

  // Title
  worksheet.mergeCells('A3:B3');
  const titleCell = worksheet.getCell('A3');
  titleCell.value = `ניתוח מכרז - ${stringify(data.tenderName)}`;
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF0D7377' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(3).height = 35;

  worksheet.getRow(4).height = 5;

  // Header
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
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF095456' } },
          bottom: { style: 'thin', color: { argb: 'FF095456' } },
          left: { style: 'thin', color: { argb: 'FF095456' } },
          right: { style: 'thin', color: { argb: 'FF095456' } },
        };
      });
    } else {
      row.values = [rowData.label, rowData.value];
      row.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: 'right', vertical: 'top', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
        if (colNumber === 1) {
          cell.font = { bold: true, size: 10, color: { argb: 'FF0D7377' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F0F0' } };
        } else {
          cell.font = { size: 10 };
          if (isAlternate) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F5F5' } };
          }
        }
      });
      isAlternate = !isAlternate;
    }
    currentRow++;
  }

  worksheet.getColumn(1).width = 45;
  worksheet.getColumn(2).width = 80;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ניתוח_מכרז_${stringify(data.tenderName) || 'מסמך'}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

function shareAnalysis(data: TenderAnalysis) {
  // Compress and encode data to URL
  const jsonStr = JSON.stringify(data);
  const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
  const shareUrl = `${window.location.origin}/analysis/shared?d=${encoded}`;

  // Try native share first, fallback to clipboard
  if (encoded.length < 2000 && navigator.share) {
    navigator.share({
      title: `ניתוח מכרז - ${stringify(data.tenderName)}`,
      url: shareUrl,
    }).catch(() => {
      copyToClipboard(shareUrl);
    });
  } else {
    // For large data, save to localStorage and share with key
    const key = 'analysis_' + Date.now().toString(36);
    localStorage.setItem(key, jsonStr);
    const shortUrl = `${window.location.origin}/analysis/shared?key=${key}`;
    copyToClipboard(shortUrl);
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

export default function ExportButtons({ data }: ExportButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    shareAnalysis(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="flex gap-3 flex-wrap">
      <button
        onClick={() => exportToPDF(data)}
        className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 text-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        PDF
      </button>

      <button
        onClick={() => exportToExcel(data)}
        className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-green-50 text-green-600 border border-green-200 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 text-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Excel
      </button>

      <button
        onClick={handleShare}
        className={`flex items-center gap-2 px-5 py-2.5 border rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 text-sm ${
          copied
            ? 'bg-[#0d7377] text-white border-[#0d7377]'
            : 'bg-white hover:bg-[#0d7377]/5 text-[#0d7377] border-[#0d7377]/30'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {copied ? 'הקישור הועתק!' : 'שתף קישור'}
      </button>
    </div>
  );
}
