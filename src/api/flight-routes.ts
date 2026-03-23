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

  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.get('/:id/history', controller.getHistory);

  return router;
}
