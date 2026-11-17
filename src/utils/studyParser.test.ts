import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRevisionPrompt,
  calculateQuizScore,
  countWords,
  parseStudyOutput,
} from './studyParser';

const SAMPLE_AI_RESPONSE = `
### SUMMARY
- Cellular respiration converts glucose and oxygen into usable ATP energy.
- Glycolysis occurs in the cytoplasm and breaks one glucose molecule into two pyruvate molecules.
- The citric acid cycle operates in the mitochondrial matrix and generates NADH and FADH2.
- Oxidative phosphorylation across the inner mitochondrial membrane produces the majority of ATP.
- Oxygen serves as the final electron acceptor in the electron transport chain, forming water.

### KEY_TERMS
1. **Glycolysis** | Anaerobic metabolic pathway in the cytoplasm that splits glucose into two pyruvate molecules, netting 2 ATP.
2. **Chemiosmosis** | Movement of protons down their electrochemical gradient through ATP synthase to drive ATP synthesis.
3. **ATP Synthase** | Transmembrane enzyme complex that phosphorylates ADP into ATP using the proton-motive force.

### QUIZ
Q1. Where does glycolysis take place inside a eukaryotic cell?
A) Mitochondrial matrix
B) Cytoplasm
C) Chloroplast stroma
D) Endoplasmic reticulum
Answer: B
Explanation: Glycolysis occurs in the cytosol/cytoplasm and does not require oxygen.

Q2. Which molecule acts as the final electron acceptor in aerobic respiration?
A) Carbon dioxide
B) Pyruvate
C) Oxygen
D) NAD+
Answer: C
Explanation: Oxygen accepts electrons at the end of the electron transport chain and combines with protons to form water.

Q3. How many net ATP molecules are generated per glucose molecule during glycolysis?
A) 2 ATP
B) 8 ATP
C) 32 ATP
D) 38 ATP
Answer: A
Explanation: Four ATP are produced, two are consumed, resulting in a net gain of 2 ATP.

Q4. Which stage produces the highest yield of ATP during cellular respiration?
A) Fermentation
B) Link reaction
C) Citric acid cycle
D) Oxidative phosphorylation
Answer: D
Explanation: Oxidative phosphorylation couples the electron transport chain with chemiosmosis to produce most ATP.

Q5. What is the primary role of NADH and FADH2 in cellular respiration?
A) Directly phosphorylate glucose
B) Carry high-energy electrons to the electron transport chain
C) Break down lactic acid
D) Transport oxygen across cell membranes
Answer: B
Explanation: NADH and FADH2 donate high-energy electrons to complexes in the inner mitochondrial membrane.
`;

test('parseStudyOutput extracts 5 bullets, 3 key terms, and 5 MCQs accurately', () => {
  const parsed = parseStudyOutput(SAMPLE_AI_RESPONSE);

  assert.equal(parsed.summaryBullets.length, 5);
  assert.match(parsed.summaryBullets[0], /Cellular respiration/);

  assert.equal(parsed.keyTerms.length, 3);
  assert.equal(parsed.keyTerms[0].term, 'Glycolysis');
  assert.match(parsed.keyTerms[1].definition, /ATP synthase/);

  assert.equal(parsed.mcqs.length, 5);
  assert.equal(parsed.mcqs[0].answer, 'B');
  assert.equal(parsed.mcqs[0].options.B, 'Cytoplasm');
  assert.match(parsed.mcqs[4].explanation, /inner mitochondrial membrane/);
});

test('calculateQuizScore tallies answered and correct counts accurately', () => {
  const parsed = parseStudyOutput(SAMPLE_AI_RESPONSE);
  const score = calculateQuizScore(parsed.mcqs, {
    0: 'B',
    1: 'C',
    2: 'D',
    3: 'D',
  });

  assert.equal(score.totalCount, 5);
  assert.equal(score.answeredCount, 4);
  assert.equal(score.correctCount, 3);
  assert.equal(score.percentage, 60);
});

test('countWords handles whitespace and empty strings', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('   \n\t  '), 0);
  assert.equal(countWords('Alpha beta\ngamma   delta'), 4);
});

test('buildRevisionPrompt embeds study material and section markers', () => {
  const prompt = buildRevisionPrompt('Photosynthesis converts light into chemical energy.');
  assert.match(prompt, /### SUMMARY/);
  assert.match(prompt, /### KEY_TERMS/);
  assert.match(prompt, /### QUIZ/);
  assert.match(prompt, /Photosynthesis converts light into chemical energy/);
});
