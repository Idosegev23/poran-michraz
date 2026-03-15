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
    async function load() {
      try {
        // Short URL via Vercel Blob (id= param)
        const id = searchParams.get('id');
        if (id) {
          const source = searchParams.get('source');
          // Try history first if source=history, otherwise try share then history
          const endpoints = source === 'history'
            ? [`/api/history/${id}`, `/api/share/${id}`]
            : [`/api/share/${id}`, `/api/history/${id}`];
          for (const endpoint of endpoints) {
            const res = await fetch(endpoint);
            if (res.ok) {
              setData(await res.json());
              return;
            }
          }
          throw new Error('Not found');
        }

        // Compressed format (z= param)
        const compressed = searchParams.get('z');
        if (compressed) {
          const pako = (await import('pako')).default;
          const b64 = compressed.replace(/-/g, '+').replace(/_/g, '/');
          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const jsonStr = new TextDecoder().decode(pako.inflate(bytes));
          setData(JSON.parse(jsonStr));
          return;
        }

        // Legacy uncompressed format (d= param)
        const encoded = searchParams.get('d');
        if (encoded) {
          const jsonStr = decodeURIComponent(escape(atob(encoded)));
          setData(JSON.parse(jsonStr));
          return;
        }

        setError('לא נמצא ניתוח לשיתוף. ייתכן שהקישור לא תקין.');
      } catch {
        setError('שגיאה בטעינת הניתוח.');
      }
    }
    load();
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">שגיאה</h2>
          <p className="text-gray-500 text-sm">{error}</p>
          <a href="/" className="inline-block mt-5 px-5 py-2 bg-teal-50 text-teal-700 rounded-lg font-medium hover:bg-teal-100 transition-colors border border-teal-200 text-sm">
            חזרה לדף הראשי
          </a>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen" dir="rtl">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="פורן שרם" className="h-8 object-contain" />
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-sm text-gray-400">ניתוח מכרז משותף</span>
          </div>
          <ExportButtons data={data} />
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
            <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900">ניתוח מכרז משותף</p>
            <p className="text-sm text-gray-500 mt-0.5">{stringify(data.tenderName).substring(0, 70) || 'מסמך מכרז'}</p>
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
        <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SharedContent />
    </Suspense>
  );
}
