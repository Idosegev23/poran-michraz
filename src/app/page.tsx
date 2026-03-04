'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import ResultsTable from '@/components/ResultsTable';
import ExportButtons from '@/components/ExportButtons';
import { TenderAnalysis } from '@/lib/types';

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
      <header className="glass sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <img src="/logo.png" alt="פורן שרם" className="h-11 object-contain" />
            <div className="h-8 w-px bg-[#0d7377]/20" />
            <div>
              <h1 className="text-lg font-bold text-[#0d7377]">מנתח מכרזים</h1>
              <p className="text-[11px] text-gray-400 -mt-0.5">מופעל על ידי בינה מלאכותית</p>
            </div>
          </div>
          {analysisData && (
            <button
              onClick={handleReset}
              className="px-5 py-2.5 text-sm font-medium bg-[#0d7377] hover:bg-[#095456] text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              + ניתוח מכרז חדש
            </button>
          )}
        </div>
      </header>

      {/* Upload Section */}
      {!analysisData && (
        <div className="flex-1 flex flex-col">
          {/* Hero */}
          <div className="bg-gradient-animated text-white py-16 px-6 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full" />
            </div>

            <div className="max-w-3xl mx-auto text-center relative z-10">
              <div className="animate-fade-in-up">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  מערכת AI מוכנה לניתוח
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  ניתוח מכרזים אוטומטי
                </h2>
                <p className="text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
                  העלה מסמך מכרז והמערכת תנתח אותו מקצה לקצה,
                  <br />
                  תחלץ את כל המידע הרלוונטי בטבלה מסודרת
                </p>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="flex-1 px-6 -mt-8 relative z-10">
            <div className="max-w-3xl mx-auto">
              <div className="animate-fade-in-up delay-100">
                <FileUpload
                  onAnalysisComplete={handleAnalysisComplete}
                  onError={handleError}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="mt-6 animate-slide-down bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">שגיאה בעיבוד</p>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Feature Cards */}
              <div className="mt-12 mb-12 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="animate-fade-in-up delay-200 group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#0d7377] to-[#14b8a6] rounded-2xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2 text-base">העלאת מסמך</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">גרור ושחרר קובץ PDF או Word עם מסמכי המכרז</p>
                </div>

                <div className="animate-fade-in-up delay-300 group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#0d7377] to-[#14b8a6] rounded-2xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2 text-base">ניתוח AI עמוק</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">בינה מלאכותית מנתחת ומחלצת 27+ שדות מהמסמך</p>
                </div>

                <div className="animate-fade-in-up delay-400 group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#0d7377] to-[#14b8a6] rounded-2xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2 text-base">ייצוא מסודר</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">ייצוא PDF ו-Excel מעוצבים עם לוגו החברה</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {analysisData && (
        <div className="flex-1 px-6 py-8">
          <div className="max-w-6xl mx-auto animate-fade-in-up space-y-6">
            {/* Success Banner */}
            <div className="bg-gradient-to-l from-[#0d7377] to-[#14b8a6] text-white rounded-2xl p-5 shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-lg">הניתוח הושלם בהצלחה</p>
                  <p className="text-white/70 text-sm">{analysisData.tenderName || 'מסמך מכרז'}</p>
                </div>
              </div>
              <ExportButtons data={analysisData} />
            </div>

            <ResultsTable data={analysisData} />

            {/* Bottom export */}
            <div className="flex justify-center pt-4 pb-8">
              <ExportButtons data={analysisData} />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200/60 bg-white/50 backdrop-blur-sm py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
          <span>פורן שרם - ניהול פרויקטים, הנדסה, פיקוח</span>
          <span>מופעל על ידי Claude AI</span>
        </div>
      </footer>
    </main>
  );
}
