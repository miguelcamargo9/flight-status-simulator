import { FlightPhase, PhaseConfig, Position } from './types';

export const LAX: Position = { latitude: 33.9425, longitude: -118.4081 };
export const JFK: Position = { latitude: 40.6413, longitude: -73.7781 };

export const PHASE_CONFIGS: PhaseConfig[] = [
  {
    phase: FlightPhase.Boarding,
    durationMinutes: 30,
    altitude: { start: 0, end: 0 },
    speed: { start: 0, end: 0 },
    fuelBurnRate: 0.05,
    isAirborne: false,
  },
  {
    phase: FlightPhase.TaxiOut,
    durationMinutes: 15,
    altitude: { start: 0, end: 0 },
    speed: { start: 0, end: 20 },
    fuelBurnRate: 0.1,
    isAirborne: false,
  },
  {
    phase: FlightPhase.TakeoffClimb,
    durationMinutes: 25,
    altitude: { start: 0, end: 35000 },
    speed: { start: 150, end: 460 },
    fuelBurnRate: 0.3,
    isAirborne: true,
  },
  {
    phase: FlightPhase.Cruise,
    durationMinutes: 210,
    altitude: { start: 35000, end: 35000 },
    speed: { start: 460, end: 460 },
    fuelBurnRate: 0.15,
    isAirborne: true,
  },
  {
    phase: FlightPhase.Descent,
    durationMinutes: 25,
    altitude: { start: 35000, end: 2000 },
    speed: { start: 460, end: 180 },
    fuelBurnRate: 0.1,
    isAirborne: true,
  },
  {
    phase: FlightPhase.Landing,
    durationMinutes: 5,
    altitude: { start: 2000, end: 0 },
    speed: { start: 180, end: 140 },
    fuelBurnRate: 0.15,
    isAirborne: true,
  },
  {
    phase: FlightPhase.TaxiIn,
    durationMinutes: 10,
    altitude: { start: 0, end: 0 },
    speed: { start: 20, end: 0 },
    fuelBurnRate: 0.05,
    isAirborne: false,
  },
];

export const TOTAL_FLIGHT_DURATION = PHASE_CONFIGS.reduce(
  (sum, phase) => sum + phase.durationMinutes,
  0,
);

export const TOTAL_AIRBORNE_DURATION = PHASE_CONFIGS
  .filter((p) => p.isAirborne)
  .reduce((sum, p) => sum + p.durationMinutes, 0);
