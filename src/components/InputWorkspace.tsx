import React, { useRef } from 'react';
import { BookOpen, FileText, FileUp, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { countWords } from '../utils/studyParser';

interface InputWorkspaceProps {
  notesText: string;
  onNotesChange: (value: string) => void;
  onLoadSample: () => void;
  pdfFilename: string;
  pdfText: string;
  pdfPages: number;
  isParsingPdf: boolean;
  pdfError: string | null;
  onPdfSelect: (file: File) => void;
  onClearPdf: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function InputWorkspace({
  notesText,
  onNotesChange,
  onLoadSample,
  pdfFilename,
  pdfText,
  pdfPages,
  isParsingPdf,
  pdfError,
  onPdfSelect,
  onClearPdf,
  onGenerate,
  isGenerating,
}: InputWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const notesWords = countWords(notesText);
  const pdfWords = countWords(pdfText);
  const totalWords = notesWords + pdfWords;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onPdfSelect(file);
    }
  };

  return (
    <section aria-label="Study material input" className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Option 1: Paste Study Notes */}
        <div className="glass-bento flex flex-col rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-5 w-5 text-indigo-300 shrink-0" aria-hidden="true" />
              <label htmlFor="study-notes-textarea" className="text-base sm:text-lg font-bold text-slate-50">
                Option 1: Paste Study Notes
              </label>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onLoadSample}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-400/35 bg-indigo-500/15 px-2.5 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Load Sample</span>
              </button>
              {notesText.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => onNotesChange('')}
                  aria-label="Clear pasted study notes"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-400/25 bg-slate-800/70 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-50 hover:border-slate-400/45 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          <textarea
            id="study-notes-textarea"
            value={notesText}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={9}
            placeholder="Paste lecture notes, textbook excerpts, or chapter summaries here..."
            className="w-full flex-1 rounded-xl border border-indigo-400/35 bg-slate-950/75 p-4 text-sm text-slate-100 placeholder:text-slate-500 leading-relaxed resize-y focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/35"
          />

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Plain text, markdown, or bulleted outlines supported</span>
            <span className="font-mono tabular-nums text-slate-300">{notesWords} words</span>
          </div>
        </div>

        {/* Option 2: Upload Chapter PDF */}
        <div className="glass-bento flex flex-col rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <FileUp className="h-5 w-5 text-indigo-300" aria-hidden="true" />
              <h2 className="text-base sm:text-lg font-bold text-slate-50">
                Option 2: Upload Chapter PDF
              </h2>
            </div>
            {pdfFilename && (
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  onClearPdf();
                }}
                aria-label={`Remove ${pdfFilename}`}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-400/25 bg-slate-800/70 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-50 hover:border-slate-400/45 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Remove PDF</span>
              </button>
            )}
          </div>

          <label
            htmlFor="chapter-pdf-upload"
            className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-indigo-400/40 bg-slate-950/60 p-6 text-center hover:border-violet-400/70 hover:bg-indigo-950/25 transition-colors cursor-pointer min-h-[218px]"
          >
            <input
              ref={fileInputRef}
              id="chapter-pdf-upload"
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="sr-only"
            />
            {isParsingPdf ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" aria-hidden="true" />
                <p className="text-sm font-medium text-slate-200">Extracting text from PDF...</p>
              </div>
            ) : pdfFilename ? (
              <div className="space-y-2 max-w-md">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/35 text-emerald-300">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-slate-100 break-all">{pdfFilename}</p>
                <p className="text-xs font-mono tabular-nums text-emerald-300">
                  Extracted {pdfWords} words across {pdfPages || 1} page{pdfPages === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-slate-400">Click to replace with another PDF</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-w-xs">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-400/35 text-indigo-300">
                  <FileUp className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-slate-100">
                  Click to select a chapter PDF
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Server-side PDF text extraction ready. Works standalone or combined with Option 1 notes.
                </p>
              </div>
            )}
          </label>

          {pdfError && (
            <p role="alert" className="mt-3 text-xs font-medium text-rose-300">
              {pdfError}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Max recommended size: 15 MB</span>
            <span className="font-mono tabular-nums text-slate-300">{pdfWords} words</span>
          </div>
        </div>
      </div>

      {/* Primary Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-indigo-400/35 bg-slate-800/65 px-5 py-4 backdrop-blur-md">
        <div className="text-xs sm:text-sm text-slate-300">
          Combined input:{' '}
          <span className="font-mono tabular-nums font-semibold text-slate-50">
            {totalWords} words
          </span>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || isParsingPdf}
          className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-6 py-3 text-sm sm:text-base font-bold text-white shadow-lg shadow-indigo-900/50 border border-indigo-200/35 hover:brightness-110 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Synthesizing Revision Kit...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Generate Revision Kit</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
