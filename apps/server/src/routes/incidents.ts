import type { FastifyPluginAsync } from 'fastify';
import { roadsDb } from '@server/db.js';
import { fetchRouteStatus } from '@server/services/tomtom.js';

export const incidentsRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/incidents/:roadId — route status for a single road
  app.get<{ Params: { roadId: string } }>('/:roadId', async (req, reply) => {
    const road = roadsDb.get(req.params.roadId);
    if (!road) return reply.code(404).send({ ok: false, error: 'Road not found' });
    try {
      const status = await fetchRouteStatus(road.id, road.origin, road.destination);
      return reply.send({ ok: true, data: status });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return reply.code(502).send({ ok: false, error: message });
    }
  });

  // GET /api/incidents — route status for ALL configured roads (parallel fetch)
  app.get('/', async (_req, reply) => {
    const roads = roadsDb.list();
    if (roads.length === 0) return reply.send({ ok: true, data: [] });

    const results = await Promise.allSettled(
      roads.map((r) => fetchRouteStatus(r.id, r.origin, r.destination)),
    );

    const statuses = results.flatMap((r) => r.status === 'fulfilled' ? [r.value] : []);
    return reply.send({ ok: true, data: statuses });
  });
};
