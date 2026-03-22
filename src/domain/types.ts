export enum FlightPhase {
  Boarding = 'boarding',
  TaxiOut = 'taxi_out',
  TakeoffClimb = 'takeoff_climb',
  Cruise = 'cruise',
  Descent = 'descent',
  Landing = 'landing',
  TaxiIn = 'taxi_in',
  Arrived = 'arrived',
}

export enum FlightStatus {
  Active = 'active',
  Completed = 'completed',
}

export interface Position {
  latitude: number;
  longitude: number;
}

export interface FlightMetrics {
  phase: FlightPhase;
  altitude: number;
  airspeed: number;
  heading: number;
  position: Position;
  fuelRemaining: number;
  outsideAirTemperature: number;
  eta: number;
  elapsedMinutes: number;
  timestamp: string;
}

export interface Flight {
  id: string;
  callsign: string;
  status: FlightStatus;
  timeScale: number;
  startedAt: string;
  completedAt: string | null;
  currentMetrics: FlightMetrics | null;
}

export interface PhaseConfig {
  phase: FlightPhase;
  durationMinutes: number;
  altitude: { start: number; end: number };
  speed: { start: number; end: number };
  fuelBurnRate: number;
  isAirborne: boolean;
}
