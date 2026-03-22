import { Router } from 'express';
import { FlightController } from './flight-controller';
import { FlightRepository } from '../repository/flight-repository';
import { SimulationEngine } from '../simulation/simulation-engine';

export function createFlightRouter(
  repository: FlightRepository,
  engine: SimulationEngine,
): Router {
  const router = Router();
  const controller = new FlightController(repository, engine);

  /**
   * @openapi
   * /flights:
   *   post:
   *     summary: Start a new flight simulation
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateFlightRequest'
   *     responses:
   *       201:
   *         description: Flight simulation started
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Flight'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post('/', controller.create);

  /**
   * @openapi
   * /flights:
   *   get:
   *     summary: List all flights (active and completed)
   *     responses:
   *       200:
   *         description: List of flights
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Flight'
   */
  router.get('/', controller.list);

  /**
   * @openapi
   * /flights/{id}:
   *   get:
   *     summary: Get current flight status and latest metrics
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Flight details with current metrics
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Flight'
   *       404:
   *         description: Flight not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/:id', controller.getById);

  /**
   * @openapi
   * /flights/{id}/history:
   *   get:
   *     summary: Get full metric history for a flight
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Array of metric snapshots
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/FlightMetrics'
   *       404:
   *         description: Flight not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/:id/history', controller.getHistory);

  return router;
}
