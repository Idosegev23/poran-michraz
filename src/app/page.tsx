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
    <main className="min-h-screen flex flex-col relative z-10">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0B1120]/80 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src="/logo.png" alt="פורן שרם" className="h-9 object-contain brightness-0 invert opacity-90" />
            </div>
            <div className="h-5 w-px bg-white/10" />
            <span className="text-sm font-medium text-white/40">ניתוח מכרזים</span>
          </div>
          <div className="flex items-center gap-3">
            {analysisData && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 rounded-xl transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                מכרז חדש
              </button>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
              <span className="text-xs text-teal-400 font-medium">AI פעיל</span>
            </div>
          </div>
        </div>
      </header>

      {/* Upload State */}
      {!analysisData && (
        <div className="flex-1 flex flex-col">
          {/* Hero */}
          <div className="pt-20 pb-6 px-6">
            <div className="max-w-3xl mx-auto text-center animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-sm text-white/50 mb-8">
                <span className="text-teal-400">Claude Opus 4.6</span>
                <span className="text-white/20">|</span>
                <span>ניתוח עומק עם חשיבה מורחבת</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-5">
                <span className="text-white">ניתוח מכרזים</span>
                <br />
                <span className="bg-gradient-to-l from-teal-400 to-emerald-300 bg-clip-text text-transparent">
                  בבינה מלאכותית
                </span>
              </h1>
              <p className="text-lg text-white/40 max-w-lg mx-auto leading-relaxed">
                העלה מסמך מכרז והמערכת תנתח אותו מקצה לקצה,
                תחלץ 27+ שדות מובנים בטבלה מסודרת
              </p>
            </div>
          </div>

          {/* Upload */}
          <div className="px-6 pb-8">
            <div className="max-w-2xl mx-auto animate-fade-up delay-100">
              <FileUpload
                onAnalysisComplete={handleAnalysisComplete}
                onError={handleError}
              />
            </div>

            {error && (
              <div className="mt-6 max-w-2xl mx-auto animate-fade-up glass-card p-4 border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bento Features */}
          <div className="px-6 pb-16 mt-4">
            <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: '📄', title: 'PDF & Word', desc: 'העלאת מסמכים' },
                { icon: '🧠', title: 'ניתוח עמוק', desc: '27+ שדות' },
                { icon: '📊', title: 'ייצוא', desc: 'PDF & Excel' },
                { icon: '🔗', title: 'שיתוף', desc: 'קישור ישיר' },
              ].map((item, i) => (
                <div
                  key={item.title}
                  className={`animate-fade-up delay-${(i + 2) * 100} glass-card glass-card-hover p-5 text-center`}
                >
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <p className="text-sm font-semibold text-white/80">{item.title}</p>
                  <p className="text-xs text-white/30 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results State */}
      {analysisData && (
        <div className="flex-1 px-6 py-8">
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
            {/* Success bar */}
            <div className="glass-card p-5 flex items-center justify-between glow-brand">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-teal-500/15 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">הניתוח הושלם</p>
                  <p className="text-sm text-white/40 mt-0.5">{stringify(analysisData.tenderName).substring(0, 70) || 'מסמך מכרז'}</p>
                </div>
              </div>
              <ExportButtons data={analysisData} />
            </div>

            <ResultsTable data={analysisData} />

            <div className="flex justify-center pt-2 pb-8">
              <ExportButtons data={analysisData} />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-white/[0.04] py-5 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-white/20">
          <span>פורן שרם - ניהול פרויקטים, הנדסה, פיקוח</span>
          <span>Powered by Claude AI</span>
        </div>
      </footer>
    </main>
  );
}
