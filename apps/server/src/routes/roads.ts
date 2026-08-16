import type { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';
import { roadsDb } from '@server/db.js';
import type { CreateRoadPayload, UpdateRoadPayload } from '@cartrack/shared';

export const roadsRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/roads
  app.get('/', async (_req, reply) => {
    return reply.send({ ok: true, data: roadsDb.list() });
  });

  // GET /api/roads/:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const road = roadsDb.get(req.params.id);
    if (!road) return reply.code(404).send({ ok: false, error: 'Road not found' });
    return reply.send({ ok: true, data: road });
  });

  // POST /api/roads
  app.post<{ Body: CreateRoadPayload }>('/', async (req, reply) => {
    const { name, origin, destination } = req.body;
    if (!name || !Array.isArray(origin) || origin.length !== 2 ||
        !Array.isArray(destination) || destination.length !== 2) {
      return reply.code(400).send({ ok: false, error: 'name, origin[2] and destination[2] are required' });
    }
    const road = {
      id: randomUUID(),
      name,
      originName: req.body.originName,
      destinationName: req.body.destinationName,
      origin: origin as [number, number],
      destination: destination as [number, number],
      createdAt: new Date().toISOString(),
    };
    roadsDb.insert(road);
    return reply.code(201).send({ ok: true, data: road });
  });

  // PATCH /api/roads/:id
  app.patch<{ Params: { id: string }; Body: UpdateRoadPayload }>('/:id', async (req, reply) => {
    const existing = roadsDb.get(req.params.id);
    if (!existing) return reply.code(404).send({ ok: false, error: 'Road not found' });
    const updated = roadsDb.update(req.params.id, req.body);
    return reply.send({ ok: true, data: updated });
  });

  // DELETE /api/roads/:id
  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const deleted = roadsDb.delete(req.params.id);
    if (!deleted) return reply.code(404).send({ ok: false, error: 'Road not found' });
    return reply.send({ ok: true, data: null });
  });
};
