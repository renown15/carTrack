import type { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';
import { roadsDb } from '../db.js';
import type { CreateRoadPayload, UpdateRoadPayload } from '@cartrack/shared';

export const roadsRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/roads
  app.get('/', async (_req, reply) => {
    const roads = roadsDb.list();
    return reply.send({ ok: true, data: roads });
  });

  // GET /api/roads/:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const road = roadsDb.get(req.params.id);
    if (!road) return reply.code(404).send({ ok: false, error: 'Road not found' });
    return reply.send({ ok: true, data: road });
  });

  // POST /api/roads
  app.post<{ Body: CreateRoadPayload }>('/', async (req, reply) => {
    const body = req.body;
    if (!body.name || !body.bbox || body.bbox.length !== 4) {
      return reply.code(400).send({ ok: false, error: 'name and bbox[4] are required' });
    }
    const road = {
      id: randomUUID(),
      name: body.name,
      description: body.description,
      bbox: body.bbox,
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
