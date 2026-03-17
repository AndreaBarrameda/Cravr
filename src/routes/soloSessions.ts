import { Router } from 'express';

export const soloSessionsRouter = Router();

type SoloSession = {
  id: string;
  user_id: string;
  craving_id: string;
  cuisine: string;
  restaurant_id: string;
  dish_id?: string;
  location: { lat: number; lng: number };
  time_window: { start: string; end: string };
  vibe_tags: string[];
  dining_intent: string;
  status: 'active' | 'ended';
};

// In-memory store for prototype
const soloSessions = new Map<string, SoloSession>();

soloSessionsRouter.post('/', (req, res) => {
  const {
    craving_id,
    cuisine,
    restaurant_id,
    dish_id,
    location,
    time_window,
    vibe_tags = [],
    dining_intent
  } = req.body as any;

  if (!craving_id || !cuisine || !restaurant_id || !location || !time_window || !dining_intent) {
    return res.status(400).json({ error: 'missing required fields' });
  }

  const id = `ss_${Date.now()}`;
  const session: SoloSession = {
    id,
    user_id: 'u_mock', // wire to auth later
    craving_id,
    cuisine,
    restaurant_id,
    dish_id,
    location,
    time_window,
    vibe_tags,
    dining_intent,
    status: 'active'
  };

  soloSessions.set(id, session);

  return res.json({ solo_session_id: id, status: 'active' });
});

