'use client';

import { useState, useCallback } from 'react';
import { TenderAnalysis, FIELD_LABELS, DATE_LABELS } from '@/lib/types';

interface ResultsTableProps {
  data: TenderAnalysis;
  onDataChange?: (data: TenderAnalysis) => void;
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

function DataRow({ label, value, onEdit }: { label: string; value: unknown; onEdit?: (newVal: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState('');
  const display = stringify(value);
  const has = display.length > 0;
  const long = display.length > 120;

  const startEdit = (e: React.MouseEvent) => {
    if (!onEdit) return;
    e.stopPropagation();
    setEditVal(display);
    setEditing(true);
  };

  const saveEdit = () => {
    if (onEdit && editVal !== display) onEdit(editVal);
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  const editIcon = onEdit ? (
    <button onClick={startEdit} className="p-1 text-gray-300 hover:text-teal-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" title="ערוך">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  ) : null;

  if (editing) {
    return (
      <div className="border-b border-gray-100 last:border-b-0 py-3 px-4">
        <p className="text-sm font-medium text-teal-700 mb-1.5">{label}</p>
        <textarea
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          className="w-full text-sm text-gray-700 border border-teal-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-teal-400 min-h-[60px] resize-y"
          autoFocus
          dir="rtl"
        />
        <div className="flex gap-2 mt-1.5">
          <button onClick={saveEdit} className="px-3 py-1 text-xs font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700">שמור</button>
          <button onClick={cancelEdit} className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200">ביטול</button>
        </div>
      </div>
    );
  }

  if (!has) {
    return (
      <div className="border-b border-gray-100 last:border-b-0 py-3 px-4 flex items-start gap-3 group">
        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-2 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-sm text-gray-400 mt-0.5">לא רלוונטי / אין</p>
        </div>
        {editIcon}
      </div>
    );
  }

  if (!long) {
    return (
      <div className="border-b border-gray-100 last:border-b-0 py-3 px-4 flex items-start gap-3 group">
        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-teal-700">{label}</p>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{display}</p>
        </div>
        {editIcon}
      </div>
    );
  }

  return (
    <div className="border-b border-gray-100 last:border-b-0 group">
      <div className="w-full py-3 px-4 flex items-start gap-3 text-right">
        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2">
              <p className="text-sm font-medium text-teal-700">{label}</p>
              <svg
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <p className={`mt-1 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap ${!expanded ? 'line-clamp-2' : ''}`}>
            {display}
          </p>
        </div>
        {editIcon}
      </div>
    </div>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 px-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-4 bg-teal-500 rounded-full" />
          <span className="font-semibold text-sm text-gray-800">{title}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`transition-all duration-200 overflow-hidden ${open ? 'max-h-[5000px]' : 'max-h-0'}`}>
        {children}
      </div>
    </div>
  );
}

function RiskMeter({ score }: { score: number }) {
  const clamp = Math.max(1, Math.min(10, score));
  const pct = (clamp / 10) * 100;
  const color = clamp <= 3 ? '#10B981' : clamp <= 6 ? '#F59E0B' : '#EF4444';
  const label = clamp <= 3 ? 'סיכון נמוך' : clamp <= 6 ? 'סיכון בינוני' : 'סיכון גבוה';
  const bg = clamp <= 3 ? 'bg-emerald-50 border-emerald-200' : clamp <= 6 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
  const textColor = clamp <= 3 ? 'text-emerald-700' : clamp <= 6 ? 'text-amber-700' : 'text-red-700';

  return (
    <div className={`card overflow-hidden mb-3 border ${bg}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-4 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-semibold text-sm text-gray-800">ציון סיכון כולל</span>
          </div>
          <span className={`text-2xl font-bold ${textColor}`}>{clamp}/10</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-gray-400">נמוך</span>
          <span className={`text-xs font-medium ${textColor}`}>{label}</span>
          <span className="text-[10px] text-gray-400">גבוה</span>
        </div>
      </div>
    </div>
  );
}

function ExecutiveSummary({ summary }: { summary: string }) {
  const isGo = summary.toUpperCase().startsWith('GO');
  const icon = isGo ? '✓' : '✗';
  const verdict = isGo ? 'GO' : 'NO-GO';
  const bg = isGo ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200';
  const badgeBg = isGo ? 'bg-emerald-600' : 'bg-red-600';
  const textColor = isGo ? 'text-emerald-800' : 'text-red-800';

  // Strip the GO/NO-GO prefix for display
  const cleaned = summary.replace(/^(NO-GO|GO)\s*[-–—:]\s*/i, '').trim();

  return (
    <div className={`card overflow-hidden mb-3 border ${bg}`}>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className={`${badgeBg} text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1`}>
            <span>{icon}</span> {verdict}
          </span>
          <span className="font-semibold text-sm text-gray-800">סיכום מנהלים – המלצה</span>
        </div>
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${textColor}`}>{cleaned}</p>
      </div>
    </div>
  );
}

function SubmissionChecklist({ checklist }: { checklist: string }) {
  const parseItems = useCallback(() => {
    return checklist.split('\n').filter(l => l.trim()).map(line => {
      const text = line.replace(/^\[\s*[xX✓]?\s*\]\s*/, '').replace(/^[-•]\s*/, '').trim();
      return { text, checked: false };
    });
  }, [checklist]);

  const [items, setItems] = useState(() => parseItems());

  const toggle = (idx: number) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));
  };

  const done = items.filter(i => i.checked).length;

  return (
    <div className="card overflow-hidden mb-3">
      <div className="flex items-center justify-between py-3 px-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-4 bg-teal-500 rounded-full" />
          <span className="font-semibold text-sm text-gray-800">רשימת תיוג להגשה</span>
        </div>
        <span className="text-xs text-gray-400">{done}/{items.length} הושלמו</span>
      </div>
      <div className="p-2">
        {items.map((item, i) => (
          <label
            key={i}
            className={`flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${item.checked ? 'opacity-60' : ''}`}
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggle(i)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <span className={`text-sm text-gray-700 leading-relaxed ${item.checked ? 'line-through text-gray-400' : ''}`}>
              {item.text}
            </span>
          </label>
        ))}
      </div>
      {items.length > 0 && (
        <div className="px-4 pb-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-500"
              style={{ width: `${items.length > 0 ? (done / items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'כספי': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'משפטי': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'טכני': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'לוח זמנים': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'כ"א': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'אחר': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

function RedFlagsSection({ flags }: { flags: string }) {
  const lines = flags.split('\n').filter(l => l.trim());

  const parsed = lines.map(line => {
    const catMatch = line.match(/^\[([^\]]+)\]\s*/);
    if (catMatch) {
      return { category: catMatch[1], text: line.replace(catMatch[0], '').trim() };
    }
    // Try "category: text" format
    const colonMatch = line.match(/^(כספי|משפטי|טכני|לוח זמנים|כ"א|אחר)\s*[:：]\s*/);
    if (colonMatch) {
      return { category: colonMatch[1], text: line.replace(colonMatch[0], '').trim() };
    }
    return { category: '', text: line.trim() };
  }).filter(f => f.text);

  if (parsed.length === 0) return null;

  return (
    <div className="card overflow-hidden mb-3">
      <div className="flex items-center justify-between py-3 px-4 bg-red-50 border-b border-red-200">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-4 bg-red-500 rounded-full" />
          <span className="font-semibold text-sm text-red-800">דגלים אדומים</span>
        </div>
        <span className="text-xs text-red-400">{parsed.length} דגלים</span>
      </div>
      <div className="p-3 space-y-2">
        {parsed.map((flag, i) => {
          const colors = CATEGORY_COLORS[flag.category] || CATEGORY_COLORS['אחר'];
          return (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="flex-1 min-w-0">
                {flag.category && (
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md mb-1 ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {flag.category}
                  </span>
                )}
                <p className="text-sm text-gray-700 leading-relaxed">{flag.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ResultsTable({ data, onDataChange }: ResultsTableProps) {
  const mainFields = Object.entries(FIELD_LABELS).filter(([key]) => key !== 'tenderName');

  const editField = (key: string, val: string) => {
    if (!onDataChange) return;
    onDataChange({ ...data, [key]: val });
  };

  const editDate = (key: string, val: string) => {
    if (!onDataChange) return;
    onDataChange({
      ...data,
      relevantDates: { ...data.relevantDates, [key]: val },
    });
  };

  return (
    <div className="w-full" id="results-table">
      {/* Header + Summary */}
      <div className="card overflow-hidden mb-3">
        <div className="p-5 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
                <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">תוצאות ניתוח המכרז</h2>
                <p className="text-xs text-gray-400 mt-0.5">{stringify(data.tenderName).substring(0, 80) || 'ללא שם'}</p>
              </div>
            </div>
            <img src="/logo.png" alt="לוגו" className="h-7 object-contain opacity-40" />
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1.5">תקציר</p>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {stringify(data.tenderName) || 'לא זמין'}
          </p>
        </div>
      </div>

      {/* Executive Summary & Risk Score */}
      {data.executiveSummary && (
        <ExecutiveSummary summary={stringify(data.executiveSummary)} />
      )}
      {data.riskScore && (
        <RiskMeter score={parseInt(stringify(data.riskScore), 10) || 5} />
      )}

      <Section title="מידע כללי">
        {mainFields.slice(0, 10).map(([key, label]) => (
          <DataRow key={key} label={label} value={data[key as keyof TenderAnalysis]} onEdit={onDataChange ? (v) => editField(key, v) : undefined} />
        ))}
      </Section>

      <Section title="מועדים רלוונטיים">
        {Object.entries(DATE_LABELS).map(([key, label]) => (
          <DataRow key={key} label={label} value={data.relevantDates?.[key as keyof typeof data.relevantDates]} onEdit={onDataChange ? (v) => editDate(key, v) : undefined} />
        ))}
      </Section>

      <Section title="דרישות וצוות">
        {mainFields.slice(10, 16).map(([key, label]) => (
          <DataRow key={key} label={label} value={data[key as keyof TenderAnalysis]} onEdit={onDataChange ? (v) => editField(key, v) : undefined} />
        ))}
      </Section>

      <Section title="תמורה ואיכות">
        {mainFields.slice(16, 22).map(([key, label]) => (
          <DataRow key={key} label={label} value={data[key as keyof TenderAnalysis]} onEdit={onDataChange ? (v) => editField(key, v) : undefined} />
        ))}
      </Section>

      <Section title="מסמכים, פורמט וקנסות">
        {mainFields.slice(22).filter(([key]) => !['riskScore', 'executiveSummary', 'submissionChecklist', 'redFlags'].includes(key)).map(([key, label]) => (
          <DataRow key={key} label={label} value={data[key as keyof TenderAnalysis]} onEdit={onDataChange ? (v) => editField(key, v) : undefined} />
        ))}
      </Section>

      {/* Red Flags - dedicated visual section */}
      {data.redFlags && stringify(data.redFlags).trim() && (
        <RedFlagsSection flags={stringify(data.redFlags)} />
      )}

      {/* Submission Checklist */}
      {data.submissionChecklist && (
        <SubmissionChecklist checklist={stringify(data.submissionChecklist)} />
      )}
    </div>
  );
}
