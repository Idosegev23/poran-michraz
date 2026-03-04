'use client';

import { TenderAnalysis, FIELD_LABELS, DATE_LABELS } from '@/lib/types';
import { useState } from 'react';
import pako from 'pako';

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

async function exportToPDF(data: TenderAnalysis, setGenerating: (v: boolean) => void) {
  try {
    setGenerating(true);
    const res = await fetch('/api/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });

    if (!res.ok) throw new Error('PDF generation failed');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ניתוח_מכרז_${stringify(data.tenderName) || 'מסמך'}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
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

  // Logo
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

function shareAnalysis(data: TenderAnalysis) {
  const jsonStr = JSON.stringify(data);
  const compressed = pako.deflate(new TextEncoder().encode(jsonStr));
  // URL-safe base64
  const b64 = btoa(String.fromCharCode(...compressed))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const shareUrl = `${window.location.origin}/analysis/shared?z=${b64}`;
  navigator.clipboard.writeText(shareUrl);
}

export default function ExportButtons({ data }: ExportButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleShare = () => {
    shareAnalysis(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => exportToPDF(data, setGeneratingPdf)}
        disabled={generatingPdf}
        className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 border ${
          generatingPdf
            ? 'text-red-300/60 bg-red-500/5 border-red-500/10 cursor-wait'
            : 'text-red-400/80 bg-red-500/10 hover:bg-red-500/20 border-red-500/15'
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
        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-green-400/80 bg-green-500/10 hover:bg-green-500/20 border border-green-500/15 rounded-lg transition-all duration-300"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Excel
      </button>

      <button
        onClick={handleShare}
        className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 border ${
          copied
            ? 'text-teal-300 bg-teal-500/20 border-teal-500/30'
            : 'text-teal-400/80 bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/15'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {copied ? 'הועתק!' : 'שתף'}
      </button>
    </div>
  );
}
