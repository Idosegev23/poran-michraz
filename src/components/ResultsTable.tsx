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
  const display = stringify(value);
  const has = display.length > 0;
  const long = display.length > 120;

  if (!has) {
    return (
      <div className="border-b border-white/[0.03] last:border-b-0 py-3.5 px-5 flex items-start gap-3 opacity-40">
        <span className="w-1.5 h-1.5 bg-white/10 rounded-full mt-2 flex-shrink-0" />
        <div>
          <p className="text-sm text-white/40">{label}</p>
          <p className="text-xs text-white/15 mt-0.5">לא נמצא במסמך</p>
        </div>
      </div>
    );
  }

  if (!long) {
    return (
      <div className="border-b border-white/[0.03] last:border-b-0 py-3.5 px-5 flex items-start gap-3">
        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-teal-400/80">{label}</p>
          <p className="mt-1.5 text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{display}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-white/[0.03] last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-3.5 px-5 flex items-start gap-3 text-right hover:bg-white/[0.01] transition-colors"
      >
        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-teal-400/80">{label}</p>
            <svg
              className={`w-3 h-3 text-white/20 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <p className={`mt-1.5 text-sm text-white/60 leading-relaxed whitespace-pre-wrap ${!expanded ? 'line-clamp-2' : ''}`}>
            {display}
          </p>
        </div>
      </button>
    </div>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass-card overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 px-5 bg-gradient-to-l from-teal-500/10 to-indigo-500/5 hover:from-teal-500/15 hover:to-indigo-500/10 transition-all border-b border-white/[0.04]"
      >
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-gradient-to-b from-teal-400 to-indigo-400 rounded-full" />
          <span className="font-semibold text-sm text-white/80">{title}</span>
        </div>
        <svg
          className={`w-4 h-4 text-white/20 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
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
  const mainFields = Object.entries(FIELD_LABELS).filter(([key]) => key !== 'tenderName');

  return (
    <div className="w-full" id="results-table">
      {/* Header + Summary */}
      <div className="glass-card overflow-hidden mb-3 glow-brand">
        <div className="p-6 bg-gradient-to-l from-teal-500/10 to-indigo-500/5 border-b border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-teal-500/10 rounded-xl flex items-center justify-center border border-teal-500/20">
                <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">תוצאות ניתוח המכרז</h2>
                <p className="text-xs text-white/30 mt-0.5">{stringify(data.tenderName).substring(0, 80) || 'ללא שם'}</p>
              </div>
            </div>
            <img src="/logo.png" alt="לוגו" className="h-8 object-contain brightness-0 invert opacity-30" />
          </div>
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold text-teal-400/60 uppercase tracking-wider mb-2">תקציר</p>
          <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
            {stringify(data.tenderName) || 'לא זמין'}
          </p>
        </div>
      </div>

      <Section title="מידע כללי">
        {mainFields.slice(0, 10).map(([key, label]) => (
          <DataRow key={key} label={label} value={data[key as keyof TenderAnalysis]} />
        ))}
      </Section>

      <Section title="מועדים רלוונטיים">
        {Object.entries(DATE_LABELS).map(([key, label]) => (
          <DataRow key={key} label={label} value={data.relevantDates?.[key as keyof typeof data.relevantDates]} />
        ))}
      </Section>

      <Section title="דרישות וצוות">
        {mainFields.slice(10, 16).map(([key, label]) => (
          <DataRow key={key} label={label} value={data[key as keyof TenderAnalysis]} />
        ))}
      </Section>

      <Section title="תמורה ואיכות">
        {mainFields.slice(16, 22).map(([key, label]) => (
          <DataRow key={key} label={label} value={data[key as keyof TenderAnalysis]} />
        ))}
      </Section>

      <Section title="מסמכים, פורמט וקנסות">
        {mainFields.slice(22).map(([key, label]) => (
          <DataRow key={key} label={label} value={data[key as keyof TenderAnalysis]} />
        ))}
      </Section>
    </div>
  );
}
