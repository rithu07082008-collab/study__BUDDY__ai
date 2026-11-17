export type OptionLetter = 'A' | 'B' | 'C' | 'D';

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface StudyMcq {
  question: string;
  options: Record<OptionLetter, string>;
  answer: OptionLetter;
  explanation: string;
}

export interface StudyRevisionKit {
  summaryBullets: string[];
  keyTerms: KeyTerm[];
  mcqs: StudyMcq[];
}

export interface QuizScoreSummary {
  correctCount: number;
  answeredCount: number;
  totalCount: number;
  percentage: number;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function buildRevisionPrompt(studyMaterial: string): string {
  const trimmedText = studyMaterial.trim().slice(0, 24000);
  return `You are an expert exam revision tutor. Analyze the following study notes and produce a concise, high-yield revision kit using the EXACT section headers and format below.

STUDY MATERIAL:
"""
${trimmedText}
"""

OUTPUT FORMAT REQUIREMENTS (FOLLOW EXACTLY):

### SUMMARY
- Bullet 1 (one clear, high-yield exam takeaway)
- Bullet 2
- Bullet 3
- Bullet 4
- Bullet 5

### KEY_TERMS
1. Term Name | Clear, concise exam-ready definition
2. Term Name | Clear, concise exam-ready definition
3. Term Name | Clear, concise exam-ready definition

### QUIZ
Q1. Question text here?
A) Option A text
B) Option B text
C) Option C text
D) Option D text
Answer: A
Explanation: Brief explanation of why A is correct.

Q2. Question text here?
A) Option A text
B) Option B text
C) Option C text
D) Option D text
Answer: B
Explanation: Brief explanation of why B is correct.

Q3. Question text here?
A) Option A text
B) Option B text
C) Option C text
D) Option D text
Answer: C
Explanation: Brief explanation of why C is correct.

Q4. Question text here?
A) Option A text
B) Option B text
C) Option C text
D) Option D text
Answer: D
Explanation: Brief explanation of why D is correct.

Q5. Question text here?
A) Option A text
B) Option B text
C) Option C text
D) Option D text
Answer: A
Explanation: Brief explanation of why A is correct.`;
}

export function parseStudyOutput(rawText: string): StudyRevisionKit {
  const summaryBullets: string[] = [];
  const keyTerms: KeyTerm[] = [];
  const mcqs: StudyMcq[] = [];

  const summaryMatch = rawText.match(/###\s*SUMMARY\s*([\s\S]*?)(?=###\s*KEY_TERMS|$)/i);
  if (summaryMatch?.[1]) {
    const lines = summaryMatch[1].split(/\r?\n/);
    for (const line of lines) {
      const cleaned = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim();
      if (cleaned) {
        summaryBullets.push(cleaned);
      }
    }
  }

  const termsMatch = rawText.match(/###\s*KEY_TERMS\s*([\s\S]*?)(?=###\s*QUIZ|$)/i);
  if (termsMatch?.[1]) {
    const lines = termsMatch[1].split(/\r?\n/);
    for (const line of lines) {
      const cleaned = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim();
      const pipeIndex = cleaned.indexOf('|');
      if (pipeIndex !== -1) {
        const term = cleaned.slice(0, pipeIndex).trim().replace(/^\*+|\*+$/g, '').trim();
        const definition = cleaned.slice(pipeIndex + 1).trim();
        if (term && definition) {
          keyTerms.push({ term, definition });
        }
      }
    }
  }

  const quizMatch = rawText.match(/###\s*QUIZ\s*([\s\S]*)$/i);
  if (quizMatch?.[1]) {
    const quizBlock = quizMatch[1].trim();
    const blocks = quizBlock.split(/(?=^\s*Q\d+[.:)])/m);

    for (const rawBlock of blocks) {
      const block = rawBlock.trim();
      if (!block) continue;

      const qMatch = block.match(/^\s*Q\d+[.:)]\s*([\s\S]+?)(?=\r?\n\s*A[).])/);
      if (!qMatch?.[1]) continue;
      const question = qMatch[1].replace(/\s+/g, ' ').trim();

      const options = {} as Record<OptionLetter, string>;
      const letters: OptionLetter[] = ['A', 'B', 'C', 'D'];
      let optionCount = 0;

      for (const letter of letters) {
        const optRegex = new RegExp(`^\\s*${letter}[).]\\s*(.+)$`, 'm');
        const optMatch = block.match(optRegex);
        if (optMatch?.[1]) {
          options[letter] = optMatch[1].trim();
          optionCount += 1;
        }
      }

      if (optionCount !== 4) continue;

      const ansMatch = block.match(/Answer\s*:\s*([A-D])/i);
      const answer = (ansMatch?.[1]?.toUpperCase() as OptionLetter) || 'A';

      const expMatch = block.match(/Explanation\s*:\s*([\s\S]+)$/i);
      const explanation = expMatch?.[1]
        ? expMatch[1].replace(/\s+/g, ' ').trim()
        : 'Review the summary notes above to reinforce this concept.';

      mcqs.push({
        question,
        options,
        answer,
        explanation,
      });
    }
  }

  return {
    summaryBullets: summaryBullets.slice(0, 5),
    keyTerms: keyTerms.slice(0, 3),
    mcqs: mcqs.slice(0, 5),
  };
}

export function calculateQuizScore(
  mcqs: StudyMcq[],
  selectedAnswers: Record<number, OptionLetter | undefined>
): QuizScoreSummary {
  const totalCount = mcqs.length;
  if (totalCount === 0) {
    return { correctCount: 0, answeredCount: 0, totalCount: 0, percentage: 0 };
  }

  let correctCount = 0;
  let answeredCount = 0;

  mcqs.forEach((mcq, idx) => {
    const chosen = selectedAnswers[idx];
    if (chosen) {
      answeredCount += 1;
      if (chosen === mcq.answer) {
        correctCount += 1;
      }
    }
  });

  return {
    correctCount,
    answeredCount,
    totalCount,
    percentage: Math.round((correctCount / totalCount) * 100),
  };
}
