import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { HeroBanner } from './components/HeroBanner';
import { InputWorkspace } from './components/InputWorkspace';
import { RevisionResults } from './components/RevisionResults';
import { PythonSourceModal } from './components/PythonSourceModal';
import { SAMPLE_STUDY_NOTES } from './utils/sampleNotes';
import { countWords, OptionLetter, StudyRevisionKit } from './utils/studyParser';

export default function App() {
  const [notesText, setNotesText] = useState('');
  const [pdfFilename, setPdfFilename] = useState('');
  const [pdfText, setPdfText] = useState('');
  const [pdfPages, setPdfPages] = useState(0);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [revisionData, setRevisionData] = useState<StudyRevisionKit | null>(null);
  const [usedModel, setUsedModel] = useState('');
  const [sourceWordCount, setSourceWordCount] = useState(0);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, OptionLetter | undefined>>({});
  const [quizChecked, setQuizChecked] = useState(false);

  const [pythonModalOpen, setPythonModalOpen] = useState(false);
  const [pythonBundle, setPythonBundle] = useState({ appPy: '', requirementsTxt: '' });
  const [pythonLoading, setPythonLoading] = useState(false);
  const [pythonError, setPythonError] = useState<string | null>(null);

  const handleOpenPythonModal = async () => {
    setPythonModalOpen(true);
    if (pythonBundle.appPy) return;

    setPythonLoading(true);
    setPythonError(null);
    try {
      const response = await fetch('/api/python-bundle');
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load Python files.');
      }
      setPythonBundle({
        appPy: payload.appPy || '',
        requirementsTxt: payload.requirementsTxt || '',
      });
    } catch (err) {
      setPythonError(err instanceof Error ? err.message : 'Unable to load Python source.');
    } finally {
      setPythonLoading(false);
    }
  };

  const handlePdfSelect = async (file: File) => {
    setIsParsingPdf(true);
    setPdfError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read selected PDF file.'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, base64 }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to extract PDF text.');
      }

      if (!payload.text) {
        setPdfFilename(file.name);
        setPdfText('');
        setPdfPages(payload.totalPages || 0);
        setPdfError('No selectable text found in this PDF. Try pasting notes in Option 1.');
      } else {
        setPdfFilename(file.name);
        setPdfText(payload.text);
        setPdfPages(payload.totalPages || 1);
      }
    } catch (err) {
      setPdfFilename('');
      setPdfText('');
      setPdfPages(0);
      setPdfError(err instanceof Error ? err.message : 'Could not parse PDF.');
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleClearPdf = () => {
    setPdfFilename('');
    setPdfText('');
    setPdfPages(0);
    setPdfError(null);
  };

  const handleGenerate = async () => {
    const combinedMaterial = [notesText.trim(), pdfText.trim()].filter(Boolean).join('\n\n');
    if (!combinedMaterial) {
      setGenerateError('Please paste study notes or upload a readable PDF before generating.');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studyMaterial: combinedMaterial }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Revision generation failed.');
      }

      setRevisionData(payload.data);
      setUsedModel(payload.model || 'gemini-4-hydrogen');
      setSourceWordCount(countWords(combinedMaterial));
      setSelectedAnswers({});
      setQuizChecked(false);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Unable to generate revision kit.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (questionIdx: number, option: OptionLetter) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIdx]: option,
    }));
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizChecked(false);
  };

  return (
    <div className="neo-aurora-backdrop min-h-screen flex flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <HeroBanner onOpenPythonModal={handleOpenPythonModal} />

        <InputWorkspace
          notesText={notesText}
          onNotesChange={(val) => {
            setNotesText(val);
            if (generateError) setGenerateError(null);
          }}
          onLoadSample={() => {
            setNotesText(SAMPLE_STUDY_NOTES);
            setGenerateError(null);
          }}
          pdfFilename={pdfFilename}
          pdfText={pdfText}
          pdfPages={pdfPages}
          isParsingPdf={isParsingPdf}
          pdfError={pdfError}
          onPdfSelect={handlePdfSelect}
          onClearPdf={handleClearPdf}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />

        {generateError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-rose-400/40 bg-rose-950/50 px-5 py-4 text-sm text-rose-100"
          >
            <AlertCircle className="h-5 w-5 text-rose-300 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{generateError}</span>
          </div>
        )}

        {revisionData && (
          <RevisionResults
            data={revisionData}
            usedModel={usedModel}
            sourceWordCount={sourceWordCount}
            selectedAnswers={selectedAnswers}
            quizChecked={quizChecked}
            onSelectAnswer={handleSelectAnswer}
            onCheckQuiz={() => setQuizChecked(true)}
            onResetQuiz={handleResetQuiz}
          />
        )}
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-400/15 text-center text-sm text-slate-400">
        © 2026 Amuluru Rithwik. All Rights Reserved.
      </footer>

      <PythonSourceModal
        isOpen={pythonModalOpen}
        onClose={() => setPythonModalOpen(false)}
        appPy={pythonBundle.appPy}
        requirementsTxt={pythonBundle.requirementsTxt}
        isLoading={pythonLoading}
        error={pythonError}
      />
    </div>
  );
}
