/**
 * routes/plants.js — collection CRUD + schedule + care log
 * ---------------------------------------------------------
 * Day 1: stubs only. Real handlers land Day 4 (T-08). All routes are
 * JWT-guarded and scope by req.userId (C2, ADR-010). Business logic will
 * delegate to server/logic/plants.js (C4).
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const notYet = (_req, res) =>
  res.status(501).json({ error: 'Not implemented — lands on Day 4 (T-08)' });

router.get('/', notYet);                 // GET    /api/plants
router.post('/', notYet);                // POST   /api/plants
router.get('/schedule', notYet);         // GET    /api/plants/schedule
router.get('/:id', notYet);              // GET    /api/plants/:id
router.patch('/:id', notYet);            // PATCH  /api/plants/:id
router.delete('/:id', notYet);           // DELETE /api/plants/:id
router.post('/:id/care', notYet);        // POST   /api/plants/:id/care
router.post('/:id/growth', notYet);      // POST   /api/plants/:id/growth

export default router;
