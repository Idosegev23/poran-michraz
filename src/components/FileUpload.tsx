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
          glass-card relative overflow-hidden transition-all duration-500
          ${isLoading ? 'p-10' : 'p-12 cursor-pointer glass-card-hover'}
          ${isDragging ? 'border-teal-500/40 bg-teal-500/[0.03] scale-[1.01]' : ''}
        `}
      >
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; f && handleFile(f); }} className="hidden" disabled={isLoading} />

        {isLoading ? (
          <div className="flex flex-col items-center gap-6">
            {/* Spinner with percentage */}
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="url(#grad)" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(cur.pct / 100) * 327} 327`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#14B8A6" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{cur.pct}%</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg font-semibold text-white">{cur.text}</p>
              <p className="text-sm text-white/30 mt-1">{cur.detail}</p>
            </div>

            {fileName && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06]">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                <span className="text-xs text-white/50">{fileName}</span>
              </div>
            )}

            <div className="w-full max-w-xs">
              <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-500 transition-all duration-1000 ease-out"
                  style={{ width: `${cur.pct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-6 text-[11px] text-white/20">
              <span>{fmt(elapsed)}</span>
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div key={i} className={`h-0.5 rounded-full transition-all duration-500 ${i <= step ? 'w-3 bg-teal-500' : 'w-1.5 bg-white/10'}`} />
                ))}
              </div>
              <span>שלב {step + 1}/{STEPS.length}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative animate-float">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center border border-white/[0.06]">
                <svg className="w-9 h-9 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-red-500/80 rounded-md text-[9px] font-bold text-white">PDF</div>
              <div className="absolute -bottom-1.5 -left-1.5 px-2 py-0.5 bg-blue-500/80 rounded-md text-[9px] font-bold text-white">DOCX</div>
            </div>

            <div>
              <p className="text-xl font-semibold text-white/90">גרור ושחרר קובץ מכרז</p>
              <p className="text-sm text-white/30 mt-2">
                או <span className="text-teal-400 font-medium cursor-pointer hover:underline">בחר קובץ</span> מהמחשב
              </p>
            </div>

            <div className="flex gap-2">
              <span className="px-3 py-1 text-xs font-medium text-red-400/70 bg-red-500/10 border border-red-500/10 rounded-lg">PDF</span>
              <span className="px-3 py-1 text-xs font-medium text-blue-400/70 bg-blue-500/10 border border-blue-500/10 rounded-lg">Word</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
