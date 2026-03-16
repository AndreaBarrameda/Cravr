import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { cravingRouter } from './routes/craving';
import { discoveryRouter } from './routes/discovery';
import { soloSessionsRouter } from './routes/soloSessions';
import { craveConnectRouter } from './routes/craveConnect';
import { reservationsRouter } from './routes/reservations';
import { chatsRouter } from './routes/chats';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/craving', cravingRouter);
app.use('/api/discovery', discoveryRouter);
app.use('/api/solo-sessions', soloSessionsRouter);
app.use('/api/crave-connect', craveConnectRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/chats', chatsRouter);

app.listen(env.port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`CRAVR backend listening on 0.0.0.0:${env.port} (accessible at http://192.168.1.6:${env.port})`);
});

