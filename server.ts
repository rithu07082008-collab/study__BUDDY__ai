import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { extractText } from 'unpdf';
import { buildRevisionPrompt, parseStudyOutput } from './src/utils/studyParser.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  app.post('/api/extract-pdf', async (req, res) => {
    try {
      const { base64, filename } = req.body as { base64?: string; filename?: string };
      if (!base64 || typeof base64 !== 'string') {
        res.status(400).json({ error: 'Missing PDF file payload.' });
        return;
      }

      const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
      const buffer = Buffer.from(cleanBase64, 'base64');
      const result = await extractText(new Uint8Array(buffer), { mergePages: true });
      const text = Array.isArray(result.text) ? result.text.join('\n\n') : String(result.text || '');

      res.json({
        filename: filename || 'uploaded.pdf',
        totalPages: result.totalPages || 0,
        text: text.trim(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse PDF file.';
      res.status(500).json({ error: `Could not read PDF: ${message}` });
    }
  });

  app.post('/api/generate', async (req, res) => {
    try {
      const { studyMaterial } = req.body as { studyMaterial?: string };
      if (!studyMaterial || typeof studyMaterial !== 'string' || !studyMaterial.trim()) {
        res.status(400).json({ error: 'Please paste study notes or upload a readable PDF before generating.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error: 'GEMINI_API_KEY is not configured in the server environment. Configure it in Settings > Secrets.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = buildRevisionPrompt(studyMaterial);
      const modelConfigs: Array<{ model: string; thinkingLevel?: ThinkingLevel }> = [
        { model: 'gemini-3.1-flash-lite' },
        { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
        { model: 'gemini-3.8-flash' },
      ];
      let lastError: unknown = null;
      const attemptErrors: string[] = [];

      for (const { model: modelName, thinkingLevel } of modelConfigs) {
        const started = Date.now();
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after 12000ms`)), 12000)
          );
          const apiPromise = ai.models.generateContent({
            model: modelName,
            contents: prompt,
            ...(thinkingLevel
              ? { config: { thinkingConfig: { thinkingLevel } } }
              : {}),
          });
          const response = await Promise.race([apiPromise, timeoutPromise]);
          const rawText = response.text ?? '';
          const parsed = parseStudyOutput(rawText);

          if (parsed.summaryBullets.length > 0 || parsed.mcqs.length > 0) {
            console.log(`[generate] ${modelName} succeeded in ${Date.now() - started}ms`);
            res.json({
              model: modelName,
              data: parsed,
            });
            return;
          }
          const parseMsg = `Model ${modelName} returned an empty or unparseable response.`;
          attemptErrors.push(`${modelName}: ${parseMsg}`);
          lastError = new Error(parseMsg);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[generate] ${modelName} failed in ${Date.now() - started}ms:`, msg);
          attemptErrors.push(`${modelName} (${Date.now() - started}ms): ${msg}`);
          lastError = err;
        }
      }

      const rawDetail = lastError instanceof Error ? lastError.message : String(lastError);
      let readableDetail = rawDetail;
      try {
        const parsedErr = JSON.parse(rawDetail);
        if (parsedErr?.error?.message) {
          readableDetail = parsedErr.error.message;
        }
      } catch {
        // Keep rawDetail if not JSON
      }
      res.status(502).json({
        error: `Gemini generation failed: ${readableDetail}`,
        attempts: attemptErrors,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected server error.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/python-bundle', (_req, res) => {
    try {
      const appPy = fs.readFileSync(path.join(__dirname, 'app.py'), 'utf-8');
      const requirementsTxt = fs.readFileSync(path.join(__dirname, 'requirements.txt'), 'utf-8');
      res.json({ appPy, requirementsTxt });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to read Python files.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Study Buddy server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
