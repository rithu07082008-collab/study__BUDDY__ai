import { useState } from 'react';
import { Check, Copy, Download, X } from 'lucide-react';

interface PythonSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  appPy: string;
  requirementsTxt: string;
  isLoading: boolean;
  error: string | null;
}

export function PythonSourceModal({
  isOpen,
  onClose,
  appPy,
  requirementsTxt,
  isLoading,
  error,
}: PythonSourceModalProps) {
  const [activeTab, setActiveTab] = useState<'app' | 'req'>('app');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeContent = activeTab === 'app' ? appPy : requirementsTxt;
  const activeFilename = activeTab === 'app' ? 'app.py' : 'requirements.txt';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures in restricted frames
    }
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="python-source-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-2xl border border-indigo-400/30 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-6 py-4">
          <div>
            <h2 id="python-source-title" className="text-lg font-bold text-slate-50">
              Streamlit Python Project Files
            </h2>
            <p className="text-xs text-slate-400">
              Run locally with: <code className="text-indigo-300">pip install -r requirements.txt && streamlit run app.py</code>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Python source modal"
            className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-6 py-3 bg-slate-950/50">
          <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('app')}
              className={`rounded-md px-3 py-1.5 text-xs font-mono font-semibold transition-colors cursor-pointer ${
                activeTab === 'app'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              app.py
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('req')}
              className={`rounded-md px-3 py-1.5 text-xs font-mono font-semibold transition-colors cursor-pointer ${
                activeTab === 'req'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              requirements.txt
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!activeContent}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : `Copy ${activeFilename}`}</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownload(activeFilename, activeContent)}
              disabled={!activeContent}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download {activeFilename}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-950/80">
          {isLoading ? (
            <p className="text-sm text-slate-400">Loading Python files...</p>
          ) : error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : (
            <pre className="text-xs font-mono text-slate-200 leading-relaxed whitespace-pre">
              {activeContent}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
