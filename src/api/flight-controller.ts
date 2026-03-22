import { Request, Response } from 'express';
import crypto from 'crypto';
import { FlightRepository } from '../repository/flight-repository';
import { SimulationEngine } from '../simulation/simulation-engine';
import { FlightStatus } from '../domain/types';
import { createFlightSchema, flightIdSchema } from './validation';
import { AppError } from './errors';

export class FlightController {
  constructor(
    private repository: FlightRepository,
    private engine: SimulationEngine,
  ) {}

  create = (req: Request, res: Response): void => {
    const input = createFlightSchema.parse(req.body);
    const now = new Date();

    const flight = {
      id: crypto.randomUUID(),
      callsign: input.callsign,
      status: FlightStatus.Active,
      timeScale: input.timeScale,
      startedAt: now.toISOString(),
      completedAt: null,
      currentMetrics: null,
    };

    this.repository.createFlight(flight);
    this.engine.start(flight.id, flight.timeScale, now);

    const created = this.repository.getFlightById(flight.id);
    res.status(201).json(created);
  };

  list = (_req: Request, res: Response): void => {
    const flights = this.repository.getAllFlights();
    res.json(flights);
  };

  getById = (req: Request, res: Response): void => {
    const { id } = flightIdSchema.parse(req.params);
    const flight = this.repository.getFlightById(id);

    if (!flight) throw AppError.notFound('Flight');

    res.json(flight);
  };

  getHistory = (req: Request, res: Response): void => {
    const { id } = flightIdSchema.parse(req.params);
    const flight = this.repository.getFlightById(id);

    if (!flight) throw AppError.notFound('Flight');

    const history = this.repository.getMetricsHistory(id);
    res.json(history);
  };
}
