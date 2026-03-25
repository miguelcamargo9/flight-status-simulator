import { EventEmitter } from 'events';
import { TOTAL_FLIGHT_DURATION } from '../domain/constants';
import { FlightStatus } from '../domain/types';
import { FlightRepository } from '../repository/flight-repository';
import { calculateMetrics } from './metrics-calculator';

const TICK_INTERVAL_MS = 1000;

export class SimulationEngine {
  private activeSimulations = new Map<string, NodeJS.Timeout>();
  readonly events = new EventEmitter();

  constructor(private repository: FlightRepository) {}

  start(flightId: string, timeScale: number, startedAt: Date): void {
    if (this.activeSimulations.has(flightId)) return;

    const interval = setInterval(() => {
      this.tick(flightId, timeScale, startedAt);
    }, TICK_INTERVAL_MS);

    this.activeSimulations.set(flightId, interval);

    // Emit initial state immediately
    this.tick(flightId, timeScale, startedAt);
  }

  stop(flightId: string): void {
    const interval = this.activeSimulations.get(flightId);
    if (interval) {
      clearInterval(interval);
      this.activeSimulations.delete(flightId);
    }
  }

  resumeAll(): void {
    const activeFlights = this.repository.getActiveFlights();

    for (const flight of activeFlights) {
      const startedAt = new Date(flight.startedAt);
      const elapsedMs = Date.now() - startedAt.getTime();
      const elapsedSimMinutes = (elapsedMs / 1000) * flight.timeScale;

      if (elapsedSimMinutes >= TOTAL_FLIGHT_DURATION) {
        this.completeFlight(flight.id);
      } else {
        this.start(flight.id, flight.timeScale, startedAt);
      }
    }

    const resumed = activeFlights.length;
    if (resumed > 0) {
      console.log(`Resumed ${resumed} active simulation(s)`);
    }
  }

  isActive(flightId: string): boolean {
    return this.activeSimulations.has(flightId);
  }

  private tick(flightId: string, timeScale: number, startedAt: Date): void {
    const elapsedMs = Date.now() - startedAt.getTime();
    const elapsedSimMinutes = (elapsedMs / 60000);

    const metrics = calculateMetrics(elapsedSimMinutes * timeScale);

    this.repository.addMetricsSnapshot(flightId, metrics);
    this.events.emit(`metrics:${flightId}`, metrics);

    if (elapsedSimMinutes >= TOTAL_FLIGHT_DURATION) {
      this.completeFlight(flightId);
    }
  }

  private completeFlight(flightId: string): void {
    this.stop(flightId);
    this.repository.updateFlightStatus(
      flightId,
      FlightStatus.Completed,
      new Date().toISOString(),
    );
    this.events.emit(`completed:${flightId}`);
  }
}
