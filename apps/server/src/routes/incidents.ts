import type { FastifyPluginAsync } from 'fastify';
import { roadsDb } from '../db.js';
import { fetchIncidents } from '../services/tomtom.js';

export const incidentsRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/incidents/:roadId — live incidents for a single road
  app.get<{ Params: { roadId: string } }>('/:roadId', async (req, reply) => {
    const road = roadsDb.get(req.params.roadId);
    if (!road) return reply.code(404).send({ ok: false, error: 'Road not found' });

    try {
      const incidents = await fetchIncidents(road.id, road.bbox);
      return reply.send({ ok: true, data: incidents });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return reply.code(502).send({ ok: false, error: message });
    }
  });

  // GET /api/incidents — live incidents for ALL configured roads (parallel fetch)
  app.get('/', async (_req, reply) => {
    const roads = roadsDb.list();
    if (roads.length === 0) return reply.send({ ok: true, data: [] });

    const results = await Promise.allSettled(
      roads.map((r) => fetchIncidents(r.id, r.bbox)),
    );

    const incidents = results.flatMap((r) =>
      r.status === 'fulfilled' ? r.value : [],
    );

    return reply.send({ ok: true, data: incidents });
  });
};
