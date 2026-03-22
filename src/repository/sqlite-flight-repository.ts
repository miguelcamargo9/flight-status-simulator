import Database from 'better-sqlite3';
import { Flight, FlightMetrics, FlightStatus, FlightPhase } from '../domain/types';
import { FlightRepository } from './flight-repository';

interface FlightRow {
  id: string;
  callsign: string;
  status: string;
  time_scale: number;
  started_at: string;
  completed_at: string | null;
}

interface MetricsRow {
  phase: string;
  altitude: number;
  airspeed: number;
  heading: number;
  latitude: number;
  longitude: number;
  fuel_remaining: number;
  outside_air_temperature: number;
  eta: number;
  elapsed_minutes: number;
  timestamp: string;
}

export class SQLiteFlightRepository implements FlightRepository {
  private stmts: ReturnType<typeof this.prepareStatements>;

  constructor(private db: Database.Database) {
    this.stmts = this.prepareStatements();
  }

  createFlight(flight: Flight): void {
    this.stmts.insertFlight.run(
      flight.id,
      flight.callsign,
      flight.status,
      flight.timeScale,
      flight.startedAt,
    );
  }

  getFlightById(id: string): Flight | null {
    const row = this.stmts.selectFlight.get(id) as FlightRow | undefined;
    if (!row) return null;

    const metrics = this.getLatestMetrics(id);
    return this.toFlight(row, metrics);
  }

  getAllFlights(): Flight[] {
    const rows = this.stmts.selectAllFlights.all() as FlightRow[];
    return rows.map((row) => {
      const metrics = this.getLatestMetrics(row.id);
      return this.toFlight(row, metrics);
    });
  }

  getActiveFlights(): Flight[] {
    const rows = this.stmts.selectActiveFlights.all() as FlightRow[];
    return rows.map((row) => this.toFlight(row, null));
  }

  updateFlightStatus(id: string, status: FlightStatus, completedAt?: string): void {
    this.stmts.updateStatus.run(status, completedAt ?? null, id);
  }

  addMetricsSnapshot(flightId: string, metrics: FlightMetrics): void {
    this.stmts.insertMetrics.run(
      flightId,
      metrics.phase,
      metrics.altitude,
      metrics.airspeed,
      metrics.heading,
      metrics.position.latitude,
      metrics.position.longitude,
      metrics.fuelRemaining,
      metrics.outsideAirTemperature,
      metrics.eta,
      metrics.elapsedMinutes,
      metrics.timestamp,
    );
  }

  getLatestMetrics(flightId: string): FlightMetrics | null {
    const row = this.stmts.selectLatestMetrics.get(flightId) as MetricsRow | undefined;
    return row ? this.toMetrics(row) : null;
  }

  getMetricsHistory(flightId: string): FlightMetrics[] {
    const rows = this.stmts.selectMetricsHistory.all(flightId) as MetricsRow[];
    return rows.map(this.toMetrics);
  }

  private toFlight(row: FlightRow, metrics: FlightMetrics | null): Flight {
    return {
      id: row.id,
      callsign: row.callsign,
      status: row.status as FlightStatus,
      timeScale: row.time_scale,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      currentMetrics: metrics,
    };
  }

  private toMetrics(row: MetricsRow): FlightMetrics {
    return {
      phase: row.phase as FlightPhase,
      altitude: row.altitude,
      airspeed: row.airspeed,
      heading: row.heading,
      position: { latitude: row.latitude, longitude: row.longitude },
      fuelRemaining: row.fuel_remaining,
      outsideAirTemperature: row.outside_air_temperature,
      eta: row.eta,
      elapsedMinutes: row.elapsed_minutes,
      timestamp: row.timestamp,
    };
  }

  private prepareStatements() {
    return {
      insertFlight: this.db.prepare(`
        INSERT INTO flights (id, callsign, status, time_scale, started_at)
        VALUES (?, ?, ?, ?, ?)
      `),
      selectFlight: this.db.prepare('SELECT * FROM flights WHERE id = ?'),
      selectAllFlights: this.db.prepare('SELECT * FROM flights ORDER BY started_at DESC'),
      selectActiveFlights: this.db.prepare("SELECT * FROM flights WHERE status = 'active'"),
      updateStatus: this.db.prepare('UPDATE flights SET status = ?, completed_at = ? WHERE id = ?'),
      insertMetrics: this.db.prepare(`
        INSERT INTO metrics_snapshots
          (flight_id, phase, altitude, airspeed, heading, latitude, longitude,
           fuel_remaining, outside_air_temperature, eta, elapsed_minutes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      selectLatestMetrics: this.db.prepare(`
        SELECT * FROM metrics_snapshots
        WHERE flight_id = ? ORDER BY id DESC LIMIT 1
      `),
      selectMetricsHistory: this.db.prepare(`
        SELECT * FROM metrics_snapshots
        WHERE flight_id = ? ORDER BY id ASC
      `),
    };
  }
}
