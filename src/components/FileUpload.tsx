'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface FileUploadProps {
  onAnalysisComplete: (data: unknown) => void;
  onError: (error: string) => void;
}

const STEPS = [
  { text: 'מעלה את הקובץ', detail: 'קורא את המסמך', pct: 10 },
  { text: 'מחלץ טקסט', detail: 'מעבד תוכן', pct: 20 },
  { text: 'שולח ל-AI', detail: 'Claude Opus מתחיל', pct: 30 },
  { text: 'חושב על המסמך', detail: 'מנתח מבנה המכרז', pct: 40 },
  { text: 'מזהה תנאי סף', detail: 'סורק דרישות', pct: 50 },
  { text: 'מחלץ מועדים', detail: 'תאריכים ואנשי קשר', pct: 60 },
  { text: 'מנתח תמורה', detail: 'ניקוד וערבויות', pct: 70 },
  { text: 'דגלים אדומים', detail: 'מזהה סיכונים', pct: 80 },
  { text: 'בונה טבלה', detail: 'מסכם תוצאות', pct: 90 },
  { text: 'כמעט מוכן', detail: 'ממתין לתגובה סופית', pct: 95 },
];

export default function FileUpload({ onAnalysisComplete, onError }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t1 = useRef<NodeJS.Timeout | null>(null);
  const t2 = useRef<NodeJS.Timeout | null>(null);

  const clear = useCallback(() => {
    if (t1.current) clearInterval(t1.current);
    if (t2.current) clearInterval(t2.current);
  }, []);

  useEffect(() => clear, [clear]);

  const start = () => {
    setStep(0); setElapsed(0);
    t1.current = setInterval(() => setElapsed(p => p + 1), 1000);
    t2.current = setInterval(() => setStep(p => Math.min(p + 1, STEPS.length - 1)), 8000);
  };

  const handleFile = async (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
      onError('סוג קובץ לא נתמך. העלה PDF או Word');
      return;
    }
    setFileName(file.name);
    setIsLoading(true);
    start();
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/analyze', { method: 'POST', body: fd });
      const result = await res.json();
      result.success ? onAnalysisComplete(result.data) : onError(result.error || 'שגיאה');
    } catch { onError('שגיאה בתקשורת עם השרת'); }
    finally { clear(); setIsLoading(false); }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
  };

  const cur = STEPS[step];

  return (
    <div className="w-full">
      <div
        onClick={!isLoading ? () => fileInputRef.current?.click() : undefined}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; f && handleFile(f); }}
        className={`
          card relative overflow-hidden transition-all duration-300
          ${isLoading ? 'p-8' : 'p-10 cursor-pointer hover:border-teal-300 hover:shadow-md'}
          ${isDragging ? 'border-teal-400 bg-teal-50 shadow-md' : ''}
        `}
      >
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; f && handleFile(f); }} className="hidden" disabled={isLoading} />

        {isLoading ? (
          <div className="flex flex-col items-center gap-5">
            {/* Progress circle */}
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="#0D9488" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(cur.pct / 100) * 327} 327`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{cur.pct}%</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">{cur.text}</p>
              <p className="text-sm text-gray-400 mt-1">{cur.detail}</p>
            </div>

            {fileName && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">{fileName}</span>
              </div>
            )}

            <div className="w-full max-w-xs">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-1000 ease-out"
                  style={{ width: `${cur.pct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-gray-400">
              <span>{fmt(elapsed)}</span>
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= step ? 'w-3 bg-teal-500' : 'w-1.5 bg-gray-200'}`} />
                ))}
              </div>
              <span>שלב {step + 1}/{STEPS.length}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            <div>
              <p className="text-lg font-semibold text-gray-800">גרור ושחרר קובץ מכרז</p>
              <p className="text-sm text-gray-400 mt-1.5">
                או <span className="text-teal-600 font-medium cursor-pointer hover:underline">בחר קובץ</span> מהמחשב
              </p>
            </div>

            <div className="flex gap-2">
              <span className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-md">PDF</span>
              <span className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-md">Word</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
