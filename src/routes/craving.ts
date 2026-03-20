import { Router } from 'express';
import { resolveCraving, generateFollowupQuestions } from '../services/openaiClient';

export const cravingRouter = Router();

cravingRouter.post('/resolve', async (req, res) => {
  try {
    const { text, locale } = req.body as { text?: string; locale?: string };
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const structured = await resolveCraving(text, locale);

    // In a full implementation you would persist this and return a real id.
    const cravingId = `crv_${Date.now()}`;

    return res.json({
      craving_id: cravingId,
      ...structured
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error resolving craving', err);
    return res.status(500).json({ error: 'Failed to resolve craving' });
  }
});

cravingRouter.post('/generate-followup-questions', async (req, res) => {
  try {
    const { craving_text, cuisine } = req.body as { craving_text?: string; cuisine?: string };
    if (!craving_text || !cuisine) {
      return res.status(400).json({ error: 'craving_text and cuisine are required' });
    }

    const questions = await generateFollowupQuestions(craving_text, cuisine);

    return res.json(questions);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error generating followup questions', err);
    return res.status(500).json({ error: 'Failed to generate followup questions' });
  }
});

