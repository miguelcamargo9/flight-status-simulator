import { Flight, FlightMetrics, FlightStatus } from '../domain/types';

export interface FlightRepository {
  createFlight(flight: Flight): void;
  getFlightById(id: string): Flight | null;
  getAllFlights(): Flight[];
  getActiveFlights(): Flight[];
  updateFlightStatus(id: string, status: FlightStatus, completedAt?: string): void;
  addMetricsSnapshot(flightId: string, metrics: FlightMetrics): void;
  getLatestMetrics(flightId: string): FlightMetrics | null;
  getMetricsHistory(flightId: string): FlightMetrics[];
}
