import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import {
  calculateQuizScore,
  OptionLetter,
  StudyRevisionKit,
} from '../utils/studyParser';

interface RevisionResultsProps {
  data: StudyRevisionKit;
  usedModel: string;
  sourceWordCount: number;
  selectedAnswers: Record<number, OptionLetter | undefined>;
  quizChecked: boolean;
  onSelectAnswer: (questionIdx: number, option: OptionLetter) => void;
  onCheckQuiz: () => void;
  onResetQuiz: () => void;
}

const OPTION_LETTERS: OptionLetter[] = ['A', 'B', 'C', 'D'];

export function RevisionResults({
  data,
  usedModel,
  sourceWordCount,
  selectedAnswers,
  quizChecked,
  onSelectAnswer,
  onCheckQuiz,
  onResetQuiz,
}: RevisionResultsProps) {
  const score = calculateQuizScore(data.mcqs, selectedAnswers);

  return (
    <section aria-label="Generated revision kit" className="space-y-8 pt-2">
      {/* Metrics Row */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h2 className="text-xl font-bold text-slate-50">Revision Overview</h2>
          <span className="text-xs font-mono text-slate-400">Model: {usedModel}</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-bento rounded-2xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Source Words
            </div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-50">
              {sourceWordCount}
            </div>
          </div>

          <div className="glass-bento rounded-2xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Summary Points
            </div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-50">
              {data.summaryBullets.length}
            </div>
          </div>

          <div className="glass-bento rounded-2xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Key Terms
            </div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-50">
              {data.keyTerms.length}
            </div>
          </div>

          <div className="glass-bento rounded-2xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              {quizChecked ? 'Quiz Score' : 'Practice Quiz'}
            </div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-50">
              {quizChecked
                ? `${score.correctCount} / ${score.totalCount}`
                : data.mcqs.length}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Revision Summary */}
      {data.summaryBullets.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-50">Quick Revision Summary</h2>
          <div className="glass-bento rounded-2xl p-5">
            <ol className="space-y-2.5">
              {data.summaryBullets.map((bullet, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-indigo-400/20 bg-slate-900/60 px-4 py-3 text-sm sm:text-base text-slate-100 leading-relaxed"
                >
                  <CheckCircle2 className="h-4 w-4 text-violet-300 mt-1 shrink-0" aria-hidden="true" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* 3 Key Terms Bento Grid */}
      {data.keyTerms.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-50">Key Terms Bento Grid</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {data.keyTerms.map((item, idx) => (
              <article
                key={idx}
                className="glass-bento flex flex-col rounded-2xl p-5"
              >
                <h3 className="text-base font-bold text-indigo-200 mb-2">{item.term}</h3>
                <p className="text-sm text-slate-200 leading-relaxed">{item.definition}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 5 Interactive MCQ Cards */}
      {data.mcqs.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-50">Interactive Exam Quiz</h2>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {score.answeredCount} of {score.totalCount} answered
            </span>
          </div>

          <div className="space-y-4">
            {data.mcqs.map((mcq, qIdx) => {
              const selected = selectedAnswers[qIdx];
              const isCorrect = selected === mcq.answer;

              return (
                <fieldset
                  key={qIdx}
                  className="rounded-2xl border border-indigo-400/35 bg-slate-800/70 backdrop-blur-md p-5 sm:p-6 space-y-4"
                >
                  <legend className="sr-only">{`Question ${qIdx + 1}`}</legend>
                  <p className="text-base font-semibold text-slate-50 leading-snug">
                    <span className="font-mono text-indigo-300 mr-2">Q{qIdx + 1}.</span>
                    {mcq.question}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {OPTION_LETTERS.map((letter) => {
                      const isSelected = selected === letter;
                      const isRightOption = letter === mcq.answer;

                      let optionStyle =
                        'border-indigo-400/25 bg-slate-950/60 text-slate-200 hover:border-violet-400/60 hover:bg-indigo-950/35';

                      if (quizChecked) {
                        if (isRightOption) {
                          optionStyle =
                            'border-emerald-400/60 bg-emerald-950/45 text-emerald-100';
                        } else if (isSelected && !isRightOption) {
                          optionStyle =
                            'border-rose-400/60 bg-rose-950/45 text-rose-100';
                        }
                      } else if (isSelected) {
                        optionStyle =
                          'border-violet-400 bg-indigo-600/25 text-white ring-1 ring-violet-400/50';
                      }

                      return (
                        <label
                          key={letter}
                          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors cursor-pointer ${optionStyle}`}
                        >
                          <input
                            type="radio"
                            name={`mcq-${qIdx}`}
                            value={letter}
                            checked={isSelected}
                            onChange={() => onSelectAnswer(qIdx, letter)}
                            className="mt-0.5 accent-violet-500 cursor-pointer"
                          />
                          <span className="leading-snug">
                            <span className="font-mono font-semibold mr-1.5">{letter})</span>
                            {mcq.options[letter]}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {quizChecked && (
                    <div
                      role="status"
                      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
                        isCorrect
                          ? 'border-emerald-400/40 bg-emerald-950/40 text-emerald-100'
                          : 'border-rose-400/40 bg-rose-950/40 text-rose-100'
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-300 mt-0.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-300 mt-0.5 shrink-0" aria-hidden="true" />
                      )}
                      <div>
                        <span className="font-bold">
                          {isCorrect
                            ? `Correct (${mcq.answer})`
                            : `Incorrect (Selected: ${selected ?? 'None'} · Correct: ${mcq.answer})`}
                        </span>
                        <span className="text-slate-200"> — {mcq.explanation}</span>
                      </div>
                    </div>
                  )}
                </fieldset>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onCheckQuiz}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-5 py-3 text-sm font-bold text-white hover:brightness-110 border border-indigo-200/35 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>Check Quiz Answers</span>
            </button>
            <button
              type="button"
              onClick={onResetQuiz}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400/30 bg-slate-900/75 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Reset Quiz</span>
            </button>
          </div>

          {quizChecked && (
            <div
              role="status"
              className="rounded-xl border border-indigo-400/45 bg-gradient-to-r from-indigo-950/70 to-violet-950/60 px-5 py-4 text-sm sm:text-base font-semibold text-indigo-100 tabular-nums"
            >
              Final Score: {score.correctCount} / {score.totalCount} ({score.percentage}%)
            </div>
          )}
        </div>
      )}
    </section>
  );
}
