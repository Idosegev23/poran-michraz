'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  onAnalysisComplete: (data: unknown) => void;
  onError: (error: string) => void;
}

export default function FileUpload({ onAnalysisComplete, onError }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
      onError('סוג קובץ לא נתמך. אנא העלה PDF או Word (.docx)');
      return;
    }

    setFileName(file.name);
    setIsLoading(true);
    setProgress('מעלה את הקובץ...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress('מנתח את המסמך עם בינה מלאכותית...');

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setProgress('הניתוח הושלם!');
        onAnalysisComplete(result.data);
      } else {
        onError(result.error || 'שגיאה בעיבוד המסמך');
      }
    } catch {
      onError('שגיאה בתקשורת עם השרת. נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

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
            ? 'cursor-wait border-[#0d7377]/30 animate-pulse-glow'
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
          <div className="flex flex-col items-center gap-5 py-4">
            {/* Animated spinner */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-[#0d7377]/10" />
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-[#0d7377] border-r-[#14b8a6]" style={{ animation: 'spin-slow 1s linear infinite' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#0d7377]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-lg font-bold text-[#0d7377]">{progress}</p>
              <p className="text-sm text-gray-400 mt-1">הפעולה עשויה להימשך עד דקה</p>
            </div>
            {fileName && (
              <div className="inline-flex items-center gap-2 bg-[#0d7377]/5 rounded-full px-4 py-2">
                <svg className="w-4 h-4 text-[#0d7377]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-[#0d7377] font-medium">{fileName}</span>
              </div>
            )}
            {/* Progress bar */}
            <div className="w-64 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#0d7377] to-[#14b8a6] rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 py-4">
            {/* Icon */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-[#0d7377] to-[#14b8a6] rounded-3xl flex items-center justify-center shadow-lg shadow-[#0d7377]/20 group-hover:shadow-xl transition-shadow">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-2 -right-2 w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center shadow-md text-white text-[10px] font-bold transform rotate-12">
                PDF
              </div>
              <div className="absolute -bottom-2 -left-2 w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-md text-white text-[10px] font-bold transform -rotate-12">
                DOC
              </div>
            </div>

            <div>
              <p className="text-2xl font-bold text-gray-700">
                גרור ושחרר קובץ מכרז
              </p>
              <p className="text-gray-400 mt-2 text-base">
                או <span className="text-[#0d7377] font-semibold underline underline-offset-4 decoration-[#0d7377]/30">לחץ כאן</span> לבחירת קובץ
              </p>
            </div>

            <div className="flex gap-3 mt-1">
              <span className="px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-sm font-semibold border border-red-100">
                PDF
              </span>
              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold border border-blue-100">
                Word (.docx)
              </span>
            </div>

            {fileName && (
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 mt-1">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-green-700 font-medium">{fileName}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
