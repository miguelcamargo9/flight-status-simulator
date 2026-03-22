import {
  PHASE_CONFIGS,
  TOTAL_FLIGHT_DURATION,
  TOTAL_AIRBORNE_DURATION,
  LAX,
  JFK,
} from '../domain/constants';
import { FlightMetrics, FlightPhase, PhaseConfig } from '../domain/types';
import { intermediatePoint, forwardAzimuth } from './geo';

interface PhaseState {
  config: PhaseConfig;
  progress: number;
  elapsedInPhase: number;
  accumulatedMinutes: number;
}

export function calculateMetrics(elapsedMinutes: number): FlightMetrics {
  if (elapsedMinutes >= TOTAL_FLIGHT_DURATION) {
    return buildArrivedMetrics(TOTAL_FLIGHT_DURATION);
  }

  const state = resolveCurrentPhase(elapsedMinutes);
  const altitude = interpolate(state.config.altitude, state.progress);
  const airspeed = interpolate(state.config.speed, state.progress);
  const fuelRemaining = calculateFuelRemaining(elapsedMinutes, state);
  const airborneProgress = calculateAirborneProgress(elapsedMinutes);
  const position = resolvePosition(state.config, airborneProgress);
  const heading = resolveHeading(state.config, position);
  const outsideAirTemperature = calculateTemperature(altitude);
  const eta = Math.max(0, Math.round(TOTAL_FLIGHT_DURATION - elapsedMinutes));

  return {
    phase: state.config.phase,
    altitude: Math.round(altitude),
    airspeed: Math.round(airspeed),
    heading,
    position,
    fuelRemaining: round(fuelRemaining, 1),
    outsideAirTemperature: round(outsideAirTemperature, 1),
    eta,
    elapsedMinutes: round(elapsedMinutes, 1),
    timestamp: new Date().toISOString(),
  };
}

function resolveCurrentPhase(elapsedMinutes: number): PhaseState {
  let accumulated = 0;

  for (const config of PHASE_CONFIGS) {
    const phaseEnd = accumulated + config.durationMinutes;

    if (elapsedMinutes < phaseEnd) {
      const elapsedInPhase = elapsedMinutes - accumulated;
      return {
        config,
        progress: elapsedInPhase / config.durationMinutes,
        elapsedInPhase,
        accumulatedMinutes: accumulated,
      };
    }

    accumulated = phaseEnd;
  }

  return {
    config: PHASE_CONFIGS[PHASE_CONFIGS.length - 1],
    progress: 1,
    elapsedInPhase: PHASE_CONFIGS[PHASE_CONFIGS.length - 1].durationMinutes,
    accumulatedMinutes: accumulated - PHASE_CONFIGS[PHASE_CONFIGS.length - 1].durationMinutes,
  };
}

function calculateFuelRemaining(
  elapsedMinutes: number,
  currentState: PhaseState,
): number {
  let fuelBurned = 0;
  let accumulated = 0;

  for (const config of PHASE_CONFIGS) {
    if (accumulated >= elapsedMinutes) break;

    const minutesInThisPhase = Math.min(
      config.durationMinutes,
      elapsedMinutes - accumulated,
    );
    fuelBurned += minutesInThisPhase * config.fuelBurnRate;
    accumulated += config.durationMinutes;
  }

  return Math.max(0, 100 - fuelBurned);
}

function calculateAirborneProgress(elapsedMinutes: number): number {
  let airborneElapsed = 0;
  let accumulated = 0;

  for (const config of PHASE_CONFIGS) {
    if (accumulated >= elapsedMinutes) break;

    const minutesInPhase = Math.min(
      config.durationMinutes,
      elapsedMinutes - accumulated,
    );

    if (config.isAirborne) {
      airborneElapsed += minutesInPhase;
    }

    accumulated += config.durationMinutes;
  }

  return Math.min(1, airborneElapsed / TOTAL_AIRBORNE_DURATION);
}

function resolvePosition(config: PhaseConfig, airborneProgress: number) {
  if (!config.isAirborne && airborneProgress === 0) return { ...LAX };
  if (!config.isAirborne && airborneProgress >= 1) return { ...JFK };
  return intermediatePoint(LAX, JFK, airborneProgress);
}

function resolveHeading(config: PhaseConfig, currentPosition: { latitude: number; longitude: number }): number {
  if (!config.isAirborne) return 0;
  return forwardAzimuth(currentPosition, JFK);
}

// ISA standard atmosphere: -2°C per 1,000 ft, capped at tropopause
function calculateTemperature(altitude: number): number {
  const seaLevelTemp = 15;
  const lapseRate = 2;
  const tropopauseTemp = -56.5;

  const temp = seaLevelTemp - (altitude / 1000) * lapseRate;
  return Math.max(tropopauseTemp, temp);
}

function interpolate(range: { start: number; end: number }, progress: number): number {
  return range.start + (range.end - range.start) * progress;
}

function buildArrivedMetrics(totalMinutes: number): FlightMetrics {
  return {
    phase: FlightPhase.Arrived,
    altitude: 0,
    airspeed: 0,
    heading: 0,
    position: { ...JFK },
    fuelRemaining: round(calculateFinalFuel(), 1),
    outsideAirTemperature: 15,
    eta: 0,
    elapsedMinutes: totalMinutes,
    timestamp: new Date().toISOString(),
  };
}

function calculateFinalFuel(): number {
  const totalBurned = PHASE_CONFIGS.reduce(
    (sum, p) => sum + p.durationMinutes * p.fuelBurnRate,
    0,
  );
  return Math.max(0, 100 - totalBurned);
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
