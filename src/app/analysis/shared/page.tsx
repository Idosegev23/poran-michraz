'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ResultsTable from '@/components/ResultsTable';
import ExportButtons from '@/components/ExportButtons';
import { TenderAnalysis } from '@/lib/types';

function SharedContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<TenderAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Try URL-encoded data first
      const encoded = searchParams.get('d');
      if (encoded) {
        const jsonStr = decodeURIComponent(escape(atob(encoded)));
        setData(JSON.parse(jsonStr));
        return;
      }

      // Try localStorage key
      const key = searchParams.get('key');
      if (key) {
        const stored = localStorage.getItem(key);
        if (stored) {
          setData(JSON.parse(stored));
          return;
        }
      }

      setError('לא נמצא ניתוח לשיתוף. ייתכן שהקישור לא תקין או שפג תוקפו.');
    } catch {
      setError('שגיאה בטעינת הניתוח.');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">שגיאה</h2>
          <p className="text-gray-500">{error}</p>
          <a href="/" className="inline-block mt-6 px-6 py-3 bg-[#0d7377] text-white rounded-xl font-medium hover:bg-[#095456] transition-colors">
            חזרה לדף הראשי
          </a>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-[#0d7377] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="פורן שרם" className="h-10 object-contain" />
            <div className="h-8 w-px bg-gray-200" />
            <h1 className="text-lg font-bold text-[#0d7377]">ניתוח מכרז משותף</h1>
          </div>
          <ExportButtons data={data} />
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <ResultsTable data={data} />
      </div>
    </main>
  );
}

export default function SharedAnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-[#0d7377] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SharedContent />
    </Suspense>
  );
}
