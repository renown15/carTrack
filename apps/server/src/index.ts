import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { roadsRoutes } from './routes/roads.js';
import { incidentsRoutes } from './routes/incidents.js';
import { geocodeRoutes } from './routes/geocode.js';

const app = Fastify({ logger: { level: 'info' } });

await app.register(cors, { origin: true });

await app.register(roadsRoutes, { prefix: '/api/roads' });
await app.register(incidentsRoutes, { prefix: '/api/incidents' });
await app.register(geocodeRoutes, { prefix: '/api/geocode' });

app.get('/api/health', async () => ({ ok: true, ts: new Date().toISOString() }));

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`CarTrack server running on http://localhost:${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
