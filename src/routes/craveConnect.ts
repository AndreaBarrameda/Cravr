import { Router } from 'express';

export const craveConnectRouter = Router();

type CandidateCard = {
  candidate_user_id: string;
  profile: { first_name: string; age: number; photo_url: string; verified: boolean };
  craving_summary: string;
  restaurant: { restaurant_id: string; name: string; overlap: 'same_pick' | 'nearby' | 'none' };
  preferred_time: string;
  vibe_tags: string[];
  dining_intent: string;
  distance_meters: number;
};

// Mock candidates and swipes for prototype
const mockCandidates: CandidateCard[] = [
  {
    candidate_user_id: 'u_22',
    profile: {
      first_name: 'Mina',
      age: 27,
      photo_url: 'https://example.com/photo1.jpg',
      verified: true
    },
    craving_summary: 'Spicy comfort',
    restaurant: { restaurant_id: 'rst_mock_1', name: 'Ramen Kiro', overlap: 'same_pick' },
    preferred_time: '19:30',
    vibe_tags: ['Cozy', 'Foodie'],
    dining_intent: 'friendly_chat',
    distance_meters: 900
  }
];

const swipes = new Map<string, { direction: 'left' | 'right' }>();

craveConnectRouter.get('/cards', (req, res) => {
  const { solo_session_id } = req.query as { solo_session_id?: string };
  if (!solo_session_id) {
    return res.status(400).json({ error: 'solo_session_id is required' });
  }

  return res.json({
    cards: mockCandidates,
    next_cursor: null
  });
});

craveConnectRouter.post('/swipe', (req, res) => {
  const { solo_session_id, candidate_user_id, direction } = req.body as {
    solo_session_id?: string;
    candidate_user_id?: string;
    direction?: 'left' | 'right';
  };

  if (!solo_session_id || !candidate_user_id || !direction) {
    return res.status(400).json({ error: 'missing fields' });
  }

  const key = `${solo_session_id}:${candidate_user_id}`;
  swipes.set(key, { direction });

  // Prototype: always match on right swipe
  const matched = direction === 'right';

  return res.json({
    matched,
    match_id: matched ? `m_${Date.now()}` : undefined
  });
});

