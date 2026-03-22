import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { FlightRepository } from './repository/flight-repository';
import { SimulationEngine } from './simulation/simulation-engine';
import { createFlightRouter } from './api/flight-routes';
import { createSseHandler } from './api/sse-handler';
import { errorHandler } from './api/error-handler';
import { swaggerSpec } from './api/swagger';

export function createApp(
  repository: FlightRepository,
  engine: SimulationEngine,
) {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/flights', createFlightRouter(repository, engine));
  app.get('/flights/:id/stream', createSseHandler(repository, engine));

  app.use(errorHandler);

  return app;
}
