'use client';

import { useState } from 'react';
import { TenderAnalysis, FIELD_LABELS, DATE_LABELS } from '@/lib/types';

interface ResultsTableProps {
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

function DataRow({ label, value }: { label: string; value: unknown }) {
  const [expanded, setExpanded] = useState(false);
  const displayValue = stringify(value);
  const hasContent = displayValue.length > 0;
  const isLong = displayValue.length > 120;

  if (!hasContent) {
    // Empty field - simple static row, no interaction
    return (
      <div className="border-b border-gray-100 last:border-b-0 py-3 px-5 flex items-start gap-3 opacity-50">
        <span className="w-2 h-2 bg-gray-200 rounded-full block mt-1.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-gray-400 text-sm">{label}</p>
          <p className="text-gray-300 italic text-xs mt-0.5">לא רלוונטי / לא נמצא במסמך</p>
        </div>
      </div>
    );
  }

  if (!isLong) {
    // Short content - show directly, no expand needed
    return (
      <div className="border-b border-gray-100 last:border-b-0 py-3 px-5 flex items-start gap-3">
        <span className="w-2 h-2 bg-green-400 rounded-full block mt-1.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#0d7377] text-sm">{label}</p>
          <p className="mt-1 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{displayValue}</p>
        </div>
      </div>
    );
  }

  // Long content - expandable
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-3 px-5 flex items-start gap-3 text-right cursor-pointer hover:bg-[#0d7377]/[0.02] transition-colors"
      >
        <span className="w-2 h-2 bg-green-400 rounded-full block mt-1.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[#0d7377] text-sm">{label}</p>
            <svg
              className={`w-3.5 h-3.5 text-[#0d7377]/60 transition-transform duration-300 flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <p className={`mt-1 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap ${
            !expanded ? 'line-clamp-2' : ''
          }`}>
            {displayValue}
          </p>
        </div>
      </button>
    </div>
  );
}

function AccordionSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 px-5 bg-gradient-to-l from-[#0d7377] to-[#0a5c5f] text-white hover:from-[#0a5c5f] hover:to-[#084345] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-white/40 rounded-full" />
          <span className="font-bold text-base">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`transition-all duration-300 overflow-hidden ${open ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );
}

export default function ResultsTable({ data }: ResultsTableProps) {
  const mainFields = Object.entries(FIELD_LABELS).filter(
    ([key]) => key !== 'tenderName'
  );

  return (
    <div className="w-full" id="results-table">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div className="bg-gradient-to-l from-[#0d7377] to-[#095456] text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">תוצאות ניתוח המכרז</h2>
                <p className="text-white/60 text-sm mt-0.5">{stringify(data.tenderName).substring(0, 80) || 'ללא שם'}</p>
              </div>
            </div>
            <img src="/logo.png" alt="לוגו" className="h-10 object-contain brightness-0 invert opacity-80" />
          </div>
        </div>

        {/* Summary - always visible */}
        <div className="p-5 bg-[#0d7377]/[0.02]">
          <h3 className="font-bold text-[#0d7377] text-sm mb-2">תקציר המכרז</h3>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {stringify(data.tenderName) || 'לא זמין'}
          </p>
        </div>
      </div>

      {/* Section: General Info */}
      <AccordionSection title="מידע כללי">
        {mainFields.slice(0, 10).map(([key, label]) => (
          <DataRow key={key} label={label} value={data[key as keyof TenderAnalysis]} />
        ))}
      </AccordionSection>

      {/* Section: Dates */}
      <AccordionSection title="מועדים רלוונטיים">
        {Object.entries(DATE_LABELS).map(([key, label]) => (
          <DataRow key={key} label={label} value={data.relevantDates?.[key as keyof typeof data.relevantDates]} />
        ))}
      </AccordionSection>

      {/* Section: Team & Requirements */}
      <AccordionSection title="דרישות וצוות">
        {mainFields.slice(10, 16).map(([key, label]) => (
          <DataRow key={key} label={label} value={data[key as keyof TenderAnalysis]} />
        ))}
      </AccordionSection>

      {/* Section: Compensation & Quality */}
      <AccordionSection title="תמורה ואיכות">
        {mainFields.slice(16, 22).map(([key, label]) => (
          <DataRow key={key} label={label} value={data[key as keyof TenderAnalysis]} />
        ))}
      </AccordionSection>

      {/* Section: Documents & Penalties */}
      <AccordionSection title="מסמכים, פורמט וקנסות">
        {mainFields.slice(22).map(([key, label]) => (
          <DataRow key={key} label={label} value={data[key as keyof TenderAnalysis]} />
        ))}
      </AccordionSection>
    </div>
  );
}
