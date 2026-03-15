'use client';

import { useEffect, useState } from 'react';
import { TenderAnalysis, FIELD_LABELS, DATE_LABELS } from '@/lib/types';

interface HistoryItem {
  id: string;
  fileName: string;
  tenderName: string;
  createdAt: string;
}

interface LoadedTender {
  id: string;
  name: string;
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

const KEY_FIELDS: { key: string; label: string }[] = [
  { key: 'tenderName', label: 'תקציר המכרז' },
  { key: 'clientIdentity', label: 'זהות המזמין' },
  { key: 'riskScore', label: 'ציון סיכון' },
  { key: 'executiveSummary', label: 'המלצת Go/No-Go' },
  { key: 'projectEstimate', label: 'אומדן פרויקט' },
  { key: 'contractPeriod', label: 'תקופת התקשרות' },
  { key: 'bidBond', label: 'ערבות הצעה' },
  { key: 'performanceBond', label: 'ערבות ביצוע' },
  { key: 'scoringBreakdown', label: 'חלוקת ניקוד' },
  { key: 'bidderEligibility', label: 'תנאי סף מציע' },
  { key: 'compensationStructure', label: 'מבנה תמורה' },
  { key: 'submissionDeadline', label: 'מועד הגשה' },
  { key: 'penalties', label: 'קנסות' },
  { key: 'redFlags', label: 'דגלים אדומים' },
];

function RiskBadge({ score }: { score: string }) {
  const n = parseInt(score, 10);
  if (isNaN(n)) return <span className="text-sm text-gray-400">—</span>;
  const color = n <= 3 ? 'bg-emerald-100 text-emerald-700' : n <= 6 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-md ${color}`}>{n}/10</span>;
}

function GoBadge({ summary }: { summary: string }) {
  const isGo = summary.toUpperCase().startsWith('GO');
  const color = isGo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
  const label = isGo ? 'GO' : 'NO-GO';
  return <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-md ${color}`}>{label}</span>;
}

export default function ComparePage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [tenders, setTenders] = useState<LoadedTender[]>([]);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const startCompare = async () => {
    if (selected.length < 2) return;
    setComparing(true);
    try {
      const loaded = await Promise.all(
        selected.map(async id => {
          const res = await fetch(`/api/history/${id}`);
          const data = await res.json();
          const item = items.find(i => i.id === id);
          return { id, name: item?.tenderName || 'מכרז', data } as LoadedTender;
        })
      );
      setTenders(loaded);
    } catch {
      // ignore
    } finally {
      setComparing(false);
    }
  };

  const getValue = (tender: LoadedTender, key: string): string => {
    if (key === 'submissionDeadline') {
      return stringify(tender.data.relevantDates?.submissionDeadline);
    }
    return stringify(tender.data[key as keyof TenderAnalysis]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <main className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="פורן שרם" className="h-8 object-contain" />
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-sm text-gray-400">השוואת מכרזים</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/history"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              היסטוריה
            </a>
            <a
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
            >
              מכרז חדש
            </a>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        {tenders.length === 0 ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-1">השוואת מכרזים</h1>
            <p className="text-sm text-gray-400 mb-6">בחר 2-4 מכרזים מההיסטוריה להשוואה זה מול זה</p>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : items.length < 2 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 font-medium">צריך לפחות 2 ניתוחים בהיסטוריה כדי להשוות</p>
                <a href="/" className="inline-block mt-4 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg">
                  נתח מכרז
                </a>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`card p-3 cursor-pointer transition-all flex items-center gap-3 ${
                        selected.includes(item.id)
                          ? 'border-teal-400 bg-teal-50 shadow-sm'
                          : 'hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected.includes(item.id) ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                      }`}>
                        {selected.includes(item.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.tenderName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{item.fileName}</span>
                          <span className="text-xs text-gray-300">|</span>
                          <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={startCompare}
                  disabled={selected.length < 2 || comparing}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {comparing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      השווה {selected.length} מכרזים
                    </>
                  )}
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-gray-900">השוואת {tenders.length} מכרזים</h1>
              <button
                onClick={() => { setTenders([]); setSelected([]); }}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              >
                השוואה חדשה
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-right text-xs font-semibold text-gray-500 p-3 bg-gray-50 border border-gray-200 min-w-[160px] sticky right-0 z-10">
                      שדה
                    </th>
                    {tenders.map(t => (
                      <th key={t.id} className="text-right text-xs font-semibold text-teal-700 p-3 bg-teal-50 border border-gray-200 min-w-[250px]">
                        <div className="truncate max-w-[250px]">{t.name.substring(0, 60)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {KEY_FIELDS.map(({ key, label }) => (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="text-right text-sm font-medium text-gray-700 p-3 border border-gray-200 bg-white sticky right-0 z-10">
                        {label}
                      </td>
                      {tenders.map(t => {
                        const val = getValue(t, key);
                        return (
                          <td key={t.id} className="text-right text-sm text-gray-600 p-3 border border-gray-200 align-top">
                            {key === 'riskScore' && val ? (
                              <RiskBadge score={val} />
                            ) : key === 'executiveSummary' && val ? (
                              <div>
                                <GoBadge summary={val} />
                                <p className="mt-1 text-xs text-gray-500 line-clamp-3">{val.replace(/^(NO-GO|GO)\s*[-–—:]\s*/i, '')}</p>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap text-xs leading-relaxed line-clamp-4">
                                {val || <span className="text-gray-300">—</span>}
                              </p>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Date rows */}
                  {Object.entries(DATE_LABELS).map(([key, label]) => (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="text-right text-sm font-medium text-gray-700 p-3 border border-gray-200 bg-white sticky right-0 z-10">
                        {label}
                      </td>
                      {tenders.map(t => (
                        <td key={t.id} className="text-right text-sm text-gray-600 p-3 border border-gray-200 align-top">
                          <p className="whitespace-pre-wrap text-xs leading-relaxed">
                            {stringify(t.data.relevantDates?.[key as keyof typeof t.data.relevantDates]) || <span className="text-gray-300">—</span>}
                          </p>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
