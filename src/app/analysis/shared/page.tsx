'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ResultsTable from '@/components/ResultsTable';
import ExportButtons from '@/components/ExportButtons';
import { TenderAnalysis } from '@/lib/types';

function stringify(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  return String(val);
}

function SharedContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<TenderAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Decode base64-encoded data from URL
      const encoded = searchParams.get('d');
      if (encoded) {
        const jsonStr = decodeURIComponent(escape(atob(encoded)));
        setData(JSON.parse(jsonStr));
        return;
      }

      setError('לא נמצא ניתוח לשיתוף. ייתכן שהקישור לא תקין או שפג תוקפו.');
    } catch {
      setError('שגיאה בטעינת הניתוח.');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">שגיאה</h2>
          <p className="text-white/50">{error}</p>
          <a href="/" className="inline-block mt-6 px-6 py-3 bg-teal-500/20 text-teal-400 rounded-xl font-medium hover:bg-teal-500/30 transition-colors border border-teal-500/20">
            חזרה לדף הראשי
          </a>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen" dir="rtl">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0B1120]/80 border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="פורן שרם" className="h-9 object-contain brightness-0 invert opacity-90" />
            <div className="h-5 w-px bg-white/10" />
            <span className="text-sm font-medium text-white/40">ניתוח מכרז משותף</span>
          </div>
          <ExportButtons data={data} />
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="glass-card p-5 flex items-center gap-4 glow-brand">
          <div className="w-11 h-11 bg-teal-500/15 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white">ניתוח מכרז משותף</p>
            <p className="text-sm text-white/40 mt-0.5">{stringify(data.tenderName).substring(0, 70) || 'מסמך מכרז'}</p>
          </div>
        </div>
        <ResultsTable data={data} />
      </div>
    </main>
  );
}

export default function SharedAnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SharedContent />
    </Suspense>
  );
}
