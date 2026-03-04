'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface FileUploadProps {
  onAnalysisComplete: (data: unknown) => void;
  onError: (error: string) => void;
}

const PROGRESS_STEPS = [
  { text: 'מעלה את הקובץ...', detail: 'קורא את המסמך', pct: 10 },
  { text: 'מחלץ טקסט מהמסמך...', detail: 'מעבד את תוכן הקובץ', pct: 20 },
  { text: 'שולח לניתוח AI...', detail: 'Claude Opus מתחיל לעבוד', pct: 30 },
  { text: 'AI חושב על המסמך...', detail: 'מנתח את מבנה המכרז', pct: 40 },
  { text: 'מזהה תנאי סף...', detail: 'סורק דרישות ותנאים', pct: 50 },
  { text: 'מחלץ מועדים ופרטים...', detail: 'מזהה תאריכים ואנשי קשר', pct: 60 },
  { text: 'מנתח מבנה תמורה...', detail: 'בודק ניקוד, ערבויות וקנסות', pct: 70 },
  { text: 'מזהה דגלים אדומים...', detail: 'מחפש סיכונים ונקודות חריגות', pct: 80 },
  { text: 'בונה את הטבלה...', detail: 'מסכם ומארגן תוצאות', pct: 90 },
  { text: 'כמעט מוכן...', detail: 'ממתין לתגובה סופית מה-AI', pct: 95 },
];

export default function FileUpload({ onAnalysisComplete, onError }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    timerRef.current = null;
    stepTimerRef.current = null;
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const startProgress = () => {
    setStepIndex(0);
    setElapsed(0);

    // Elapsed timer - every second
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    // Step progression - advance every ~8 seconds
    stepTimerRef.current = setInterval(() => {
      setStepIndex(prev => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
    }, 8000);
  };

  const handleFile = async (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
      onError('סוג קובץ לא נתמך. אנא העלה PDF או Word (.docx)');
      return;
    }

    setFileName(file.name);
    setIsLoading(true);
    startProgress();

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onAnalysisComplete(result.data);
      } else {
        onError(result.error || 'שגיאה בעיבוד המסמך');
      }
    } catch {
      onError('שגיאה בתקשורת עם השרת. נסה שוב.');
    } finally {
      clearTimers();
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleClick = () => fileInputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s} שניות`;
  };

  const currentStep = PROGRESS_STEPS[stepIndex];

  return (
    <div className="w-full">
      <div
        onClick={!isLoading ? handleClick : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative bg-white rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-500 shadow-sm
          ${isLoading
            ? 'cursor-wait border-[#0d7377]/30'
            : 'cursor-pointer hover:border-[#0d7377] hover:shadow-xl hover:-translate-y-1'
          }
          ${isDragging ? 'upload-active border-[#0d7377] shadow-xl scale-[1.02]' : 'border-gray-200'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleInputChange}
          className="hidden"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-5 py-6">
            {/* Animated spinner */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-[#0d7377]/10" />
              <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-transparent border-t-[#0d7377] border-r-[#14b8a6]" style={{ animation: 'spin-slow 1s linear infinite' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#0d7377]">{currentStep.pct}%</span>
              </div>
            </div>

            {/* Status text */}
            <div className="text-center">
              <p className="text-lg font-bold text-[#0d7377]">{currentStep.text}</p>
              <p className="text-sm text-gray-400 mt-1">{currentStep.detail}</p>
            </div>

            {/* File name */}
            {fileName && (
              <div className="inline-flex items-center gap-2 bg-[#0d7377]/5 rounded-full px-4 py-2">
                <svg className="w-4 h-4 text-[#0d7377]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-[#0d7377] font-medium">{fileName}</span>
              </div>
            )}

            {/* Progress bar */}
            <div className="w-full max-w-sm">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0d7377] to-[#14b8a6] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${currentStep.pct}%` }}
                />
              </div>
            </div>

            {/* Timer & Steps */}
            <div className="flex items-center gap-6 text-xs text-gray-400">
              <span>זמן שחלף: {formatTime(elapsed)}</span>
              <span>שלב {stepIndex + 1} מתוך {PROGRESS_STEPS.length}</span>
            </div>

            {/* Step indicators */}
            <div className="flex gap-1.5">
              {PROGRESS_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i <= stepIndex
                      ? 'w-4 bg-[#0d7377]'
                      : 'w-2 bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-[#0d7377] to-[#14b8a6] rounded-3xl flex items-center justify-center shadow-lg shadow-[#0d7377]/20">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center shadow-md text-white text-[10px] font-bold transform rotate-12">
                PDF
              </div>
              <div className="absolute -bottom-2 -left-2 w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-md text-white text-[10px] font-bold transform -rotate-12">
                DOC
              </div>
            </div>

            <div>
              <p className="text-2xl font-bold text-gray-700">גרור ושחרר קובץ מכרז</p>
              <p className="text-gray-400 mt-2 text-base">
                או <span className="text-[#0d7377] font-semibold underline underline-offset-4 decoration-[#0d7377]/30">לחץ כאן</span> לבחירת קובץ
              </p>
            </div>

            <div className="flex gap-3 mt-1">
              <span className="px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-sm font-semibold border border-red-100">PDF</span>
              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold border border-blue-100">Word (.docx)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
