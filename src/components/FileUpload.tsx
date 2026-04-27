'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { upload } from '@vercel/blob/client';

interface FileUploadProps {
  onAnalysisComplete: (data: unknown) => void;
  onError: (error: string) => void;
}

const ALLOWED_EXT = ['pdf', 'doc', 'docx'];

const STEPS = [
  { text: 'מעלה קבצים', detail: 'מעלה לאחסון מאובטח', pct: 5 },
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

function getExt(name: string) {
  return name.toLowerCase().split('.').pop() || '';
}

export default function FileUpload({ onAnalysisComplete, onError }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
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

  const addFiles = (newFiles: FileList | File[]) => {
    const valid: File[] = [];
    for (const f of Array.from(newFiles)) {
      if (ALLOWED_EXT.includes(getExt(f.name))) {
        // Don't add duplicates
        if (!files.some(existing => existing.name === f.name && existing.size === f.size)) {
          valid.push(f);
        }
      }
    }
    if (valid.length === 0 && newFiles.length > 0) {
      onError('סוג קובץ לא נתמך. העלה PDF או Word');
      return;
    }
    setFiles(prev => [...prev, ...valid]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setIsLoading(true);
    start();
    try {
      // Step 1: Upload each file directly to Vercel Blob (bypasses 4.5MB API limit)
      const uploads: { url: string; name: string; size: number }[] = [];
      for (const f of files) {
        const blob = await upload(f.name, f, {
          access: 'public',
          handleUploadUrl: '/api/upload-token',
          contentType: f.type || undefined,
        });
        uploads.push({ url: blob.url, name: f.name, size: f.size });
      }

      // Step 2: Send only URLs to analyze endpoint
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploads }),
      });

      if (!res.ok || !res.body) {
        onError('שגיאה בתקשורת עם השרת');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let gotResult = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep incomplete line in buffer

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ') && eventType) {
            try {
              const data = JSON.parse(line.slice(6));
              if (eventType === 'result' && data.success) {
                onAnalysisComplete(data.data);
                gotResult = true;
              } else if (eventType === 'error') {
                onError(data.error || 'שגיאה');
                gotResult = true;
              }
              // heartbeat and progress events are ignored (connection stays alive)
            } catch {
              // ignore parse errors for individual events
            }
            eventType = '';
          } else if (line === '') {
            eventType = '';
          }
        }
      }

      if (!gotResult) {
        onError('לא התקבלה תשובה מהשרת');
      }
    } catch {
      onError('שגיאה בתקשורת עם השרת');
    } finally {
      clear();
      setIsLoading(false);
    }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
  };

  const cur = STEPS[step];

  return (
    <div className="w-full space-y-3">
      {/* Drop zone */}
      <div
        onClick={!isLoading ? () => fileInputRef.current?.click() : undefined}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
        className={`
          card relative overflow-hidden transition-all duration-300
          ${isLoading ? 'p-8' : 'p-10 cursor-pointer hover:border-teal-300 hover:shadow-md'}
          ${isDragging ? 'border-teal-400 bg-teal-50 shadow-md' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          multiple
          onChange={e => { if (e.target.files) { addFiles(e.target.files); e.target.value = ''; } }}
          className="hidden"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-5">
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

            <div className="flex flex-wrap justify-center gap-2">
              {files.map((f, i) => (
                <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-500">{f.name}</span>
                </div>
              ))}
            </div>

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
              <p className="text-lg font-semibold text-gray-800">גרור ושחרר קבצי מכרז</p>
              <p className="text-sm text-gray-400 mt-1.5">
                או <span className="text-teal-600 font-medium cursor-pointer hover:underline">בחר קבצים</span> מהמחשב
              </p>
              <p className="text-xs text-gray-300 mt-1">אפשר להעלות מספר קבצים למכרז אחד</p>
            </div>

            <div className="flex gap-2">
              <span className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-md">PDF</span>
              <span className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-md">Word</span>
            </div>
          </div>
        )}
      </div>

      {/* File list */}
      {!isLoading && files.length > 0 && (
        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-gray-500">{files.length} קבצים נבחרו</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-teal-600 hover:text-teal-800 font-medium"
            >
              + הוסף קובץ
            </button>
          </div>

          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  getExt(f.name) === 'pdf'
                    ? 'text-red-600 bg-red-50'
                    : 'text-blue-600 bg-blue-50'
                }`}>
                  {getExt(f.name).toUpperCase()}
                </span>
                <span className="text-sm text-gray-700 truncate">{f.name}</span>
                <span className="text-xs text-gray-300 flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
              </div>
              <button
                onClick={() => removeFile(i)}
                className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          <button
            onClick={handleAnalyze}
            className="w-full mt-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm rounded-lg transition-colors"
          >
            נתח {files.length > 1 ? `${files.length} קבצים` : 'מכרז'}
          </button>
        </div>
      )}
    </div>
  );
}
