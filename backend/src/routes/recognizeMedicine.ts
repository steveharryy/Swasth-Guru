import express, { Request, Response } from 'express';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Use memory storage — no disk writes, no cleanup needed
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Common medicine noise patterns to strip from OCR output
const NOISE_PATTERNS = [
  /\b(mg|ml|mcg|iu|tablet|cap|capsule|syrup|injection|inj|tabs?|caps?)\b/gi,
  /[^a-zA-Z0-9\s\-]/g,   // remove symbols except hyphen
  /\b\d{1,2}\/\d{1,2}\b/g, // strip date-like fragments
  /\b(batch|mfg|exp|lot|sr|no|rx)\b/gi,
  /\s{2,}/g,              // collapse whitespace
];

/**
 * Cleans raw OCR text and extracts the most likely medicine name.
 * Strategy: first bold capitalised word-group wins (brand names are usually prominent),
 * then fallback to the longest alpha token on the label.
 */
function extractMedicineName(rawText: string): { name: string; confidence: number } {
  let text = rawText;

  // Step 1 — strip noise
  for (const pattern of NOISE_PATTERNS) {
    text = text.replace(pattern, ' ');
  }
  text = text.trim();

  if (!text || text.length < 2) {
    return { name: '', confidence: 0 };
  }

  // Step 2 — split into lines; prioritise shorter all-caps or title-case lines
  // (medicine brand names tend to appear on the first prominent line of packaging)
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2 && l.length < 60);

  // Score each line: prefer short, mostly-alpha, title-case/uppercase lines
  const scored = lines.map(line => {
    const clean = line.replace(/[^a-zA-Z\s]/g, '').trim();
    const alphaRatio = clean.length / (line.length || 1);
    const isUpperOrTitle = /^[A-Z]/.test(clean);
    const lengthScore = Math.max(0, 1 - clean.length / 30); // shorter = better
    const score = alphaRatio * (isUpperOrTitle ? 1.4 : 1.0) * (1 + lengthScore);
    return { line: clean, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]?.line?.trim() ?? '';

  if (!best) return { name: '', confidence: 0 };

  // Step 3 — trim dosage suffix if present (e.g. "Paracetamol 500" → "Paracetamol")
  const withoutDose = best.replace(/\s+\d[\d.]*\s*$/, '').trim();

  // Confidence: heuristic based on how clean the winning line is
  const confidence = Math.min(0.95, scored[0].score / 2);

  return { name: withoutDose, confidence: parseFloat(confidence.toFixed(2)) };
}

// POST /api/recognize-medicine
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Run Tesseract OCR on the buffer directly
    const tesseractOptions: any = {};
    if (process.env.NODE_ENV === 'development') {
      tesseractOptions.logger = (m: any) => console.log('[OCR]', m.status);
    }

    const { data } = await Tesseract.recognize(req.file.buffer, 'eng', tesseractOptions);

    const rawText = data.text ?? '';
    const ocrConfidence = data.confidence ?? 0; // 0-100 from Tesseract

    if (!rawText || ocrConfidence < 20) {
      return res.status(422).json({
        error: 'Could not extract text. Try a clearer, well-lit image.',
        code: 'LOW_CONFIDENCE',
      });
    }

    const { name, confidence } = extractMedicineName(rawText);

    if (!name) {
      return res.status(422).json({
        error: 'No medicine name detected. Ensure the label is visible.',
        code: 'NOT_FOUND',
      });
    }

    return res.json({
      medicineName: name,
      confidence,
      rawText: process.env.NODE_ENV === 'development' ? rawText : undefined,
    });

  } catch (err: any) {
    console.error('[recognize-medicine] error:', err);
    return res.status(500).json({ error: 'OCR processing failed. Please try again.' });
  }
});

export default router;
