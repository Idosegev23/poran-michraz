'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import ResultsTable from '@/components/ResultsTable';
import ExportButtons from '@/components/ExportButtons';
import { TenderAnalysis } from '@/lib/types';

function stringify(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  return String(val);
}

export default function Home() {
  const [analysisData, setAnalysisData] = useState<TenderAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysisComplete = (data: unknown) => {
    setError(null);
    setAnalysisData(data as TenderAnalysis);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setAnalysisData(null);
  };

  const handleReset = () => {
    setAnalysisData(null);
    setError(null);
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="פורן שרם" className="h-8 object-contain" />
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-sm text-gray-400">ניתוח מכרזים</span>
          </div>
          <div className="flex items-center gap-2">
            {analysisData && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                מכרז חדש
              </button>
            )}
            <a
              href="/history"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              היסטוריה
            </a>
          </div>
        </div>
      </header>

      {/* Upload State */}
      {!analysisData && (
        <div className="flex-1 flex flex-col">
          <div className="pt-16 pb-6 px-6">
            <div className="max-w-2xl mx-auto text-center animate-fade-up">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                ניתוח מכרזים בבינה מלאכותית
              </h1>
              <p className="text-base text-gray-500 max-w-lg mx-auto leading-relaxed">
                העלה מסמך מכרז והמערכת תנתח אותו מקצה לקצה,
                תחלץ 27+ שדות מובנים בטבלה מסודרת
              </p>
            </div>
          </div>

          <div className="px-6 pb-8">
            <div className="max-w-xl mx-auto animate-fade-up delay-100">
              <FileUpload
                onAnalysisComplete={handleAnalysisComplete}
                onError={handleError}
              />
            </div>

            {error && (
              <div className="mt-4 max-w-xl mx-auto card p-4 border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 pb-12 mt-2">
            <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { title: 'PDF & Word', desc: 'העלאת מסמכים', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { title: 'ניתוח עמוק', desc: '27+ שדות', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                { title: 'ייצוא', desc: 'PDF & Excel', icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { title: 'שיתוף', desc: 'קישור ישיר', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
              ].map((item) => (
                <div key={item.title} className="card p-4 text-center">
                  <div className="w-9 h-9 mx-auto mb-2 bg-teal-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4.5 h-4.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results State */}
      {analysisData && (
        <div className="flex-1 px-6 py-6">
          <div className="max-w-5xl mx-auto space-y-4 animate-fade-up">
            <div className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">הניתוח הושלם</p>
                  <p className="text-sm text-gray-500 mt-0.5">{stringify(analysisData.tenderName).substring(0, 70) || 'מסמך מכרז'}</p>
                </div>
              </div>
              <ExportButtons data={analysisData} />
            </div>

            <ResultsTable data={analysisData} />

            <div className="flex justify-center pt-2 pb-6">
              <ExportButtons data={analysisData} />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-100 py-4">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
          <span>פורן שרם - ניהול פרויקטים, הנדסה, פיקוח</span>
          <span>Powered by Claude AI</span>
        </div>
      </footer>
    </main>
  );
}
