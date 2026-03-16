import { Router } from 'express';

export const chatsRouter = Router();

type Message = {
  id: string;
  match_id: string;
  sender_user_id: string;
  text: string;
  created_at: string;
};

const messages: Message[] = [];

chatsRouter.get('/:match_id/messages', (req, res) => {
  const { match_id } = req.params;
  const matchMessages = messages.filter((m) => m.match_id === match_id);
  return res.json({
    messages: matchMessages,
    next_cursor: null
  });
});

chatsRouter.post('/:match_id/messages', (req, res) => {
  const { match_id } = req.params;
  const { text } = req.body as { text?: string };
  if (!text) return res.status(400).json({ error: 'text is required' });

  const msg: Message = {
    id: `msg_${Date.now()}`,
    match_id,
    sender_user_id: 'u_mock',
    text,
    created_at: new Date().toISOString()
  };

  messages.push(msg);
  return res.json({ message: msg });
});

