import { Router } from 'express';

export const reservationsRouter = Router();

type Reservation = {
  id: string;
  user_id: string;
  restaurant_id: string;
  dish_id?: string;
  time: string;
  party_size: number;
  dining_mode: 'solo' | 'group' | 'crave_connect';
  match_id?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
};

const reservations = new Map<string, Reservation>();

reservationsRouter.post('/', (req, res) => {
  const { restaurant_id, dish_id, time, party_size, dining_mode, match_id, notes } =
    req.body as any;

  if (!restaurant_id || !time || !party_size || !dining_mode) {
    return res.status(400).json({ error: 'missing required fields' });
  }

  const id = `r_${Date.now()}`;
  const reservation: Reservation = {
    id,
    user_id: 'u_mock',
    restaurant_id,
    dish_id,
    time,
    party_size,
    dining_mode,
    match_id,
    notes,
    status: 'confirmed'
  };

  reservations.set(id, reservation);

  return res.json({ reservation_id: id, status: reservation.status });
});

reservationsRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const reservation = reservations.get(id);
  if (!reservation) {
    return res.status(404).json({ error: 'not found' });
  }
  return res.json(reservation);
});

