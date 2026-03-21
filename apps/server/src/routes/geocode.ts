import type { FastifyPluginAsync } from 'fastify';
import { geocodeSearch } from '../services/nominatim.js';

export const geocodeRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/geocode?q=A38+Bristol
  app.get<{ Querystring: { q?: string } }>('/', async (req, reply) => {
    const q = req.query.q?.trim();
    if (!q || q.length < 2) {
      return reply.code(400).send({ ok: false, error: 'q must be at least 2 characters' });
    }
    try {
      const suggestions = await geocodeSearch(q);
      return reply.send({ ok: true, data: suggestions });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return reply.code(502).send({ ok: false, error: message });
    }
  });
};
