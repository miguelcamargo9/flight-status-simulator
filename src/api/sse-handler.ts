import { Request, Response } from 'express';
import { FlightRepository } from '../repository/flight-repository';
import { SimulationEngine } from '../simulation/simulation-engine';
import { FlightMetrics } from '../domain/types';
import { flightIdSchema } from './validation';
import { AppError } from './errors';

export function createSseHandler(
  repository: FlightRepository,
  engine: SimulationEngine,
) {
  return (req: Request, res: Response): void => {
    const { id } = flightIdSchema.parse(req.params);
    const flight = repository.getFlightById(id);

    if (!flight) throw AppError.notFound('Flight');

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    if (flight.currentMetrics) {
      res.write(`data: ${JSON.stringify(flight.currentMetrics)}\n\n`);
    }

    const onMetrics = (metrics: FlightMetrics) => {
      res.write(`data: ${JSON.stringify(metrics)}\n\n`);
    };

    const onCompleted = () => {
      res.write('event: completed\ndata: {}\n\n');
      cleanup();
    };

    const cleanup = () => {
      engine.events.off(`metrics:${id}`, onMetrics);
      engine.events.off(`completed:${id}`, onCompleted);
      res.end();
    };

    engine.events.on(`metrics:${id}`, onMetrics);
    engine.events.on(`completed:${id}`, onCompleted);

    req.on('close', cleanup);
  };
}
