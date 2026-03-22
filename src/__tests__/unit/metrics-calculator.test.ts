import { calculateMetrics } from '../../simulation/metrics-calculator';
import { FlightPhase } from '../../domain/types';
import { TOTAL_FLIGHT_DURATION } from '../../domain/constants';

const LAX = { latitude: 33.9425, longitude: -118.4081 };
const JFK = { latitude: 40.6413, longitude: -73.7781 };

describe('calculateMetrics', () => {
  describe('boarding phase (0-30 min)', () => {
    it('starts at boarding with zero altitude and speed', () => {
      const metrics = calculateMetrics(0);
      expect(metrics.phase).toBe(FlightPhase.Boarding);
      expect(metrics.altitude).toBe(0);
      expect(metrics.airspeed).toBe(0);
    });

    it('stays on the ground at LAX', () => {
      const metrics = calculateMetrics(15);
      expect(metrics.position.latitude).toBeCloseTo(LAX.latitude, 2);
      expect(metrics.position.longitude).toBeCloseTo(LAX.longitude, 2);
    });

    it('has heading 0 during ground phase', () => {
      const metrics = calculateMetrics(10);
      expect(metrics.heading).toBe(0);
    });

    it('reports ground temperature (~15°C)', () => {
      const metrics = calculateMetrics(5);
      expect(metrics.outsideAirTemperature).toBeCloseTo(15, 0);
    });
  });

  describe('taxi out phase (30-45 min)', () => {
    it('transitions to taxi out after boarding', () => {
      const metrics = calculateMetrics(31);
      expect(metrics.phase).toBe(FlightPhase.TaxiOut);
    });

    it('has low speed during taxi', () => {
      const metrics = calculateMetrics(40);
      expect(metrics.airspeed).toBeLessThanOrEqual(20);
      expect(metrics.airspeed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('takeoff/climb phase (45-70 min)', () => {
    it('transitions to takeoff/climb', () => {
      const metrics = calculateMetrics(46);
      expect(metrics.phase).toBe(FlightPhase.TakeoffClimb);
    });

    it('increases altitude during climb', () => {
      const early = calculateMetrics(50);
      const late = calculateMetrics(65);
      expect(late.altitude).toBeGreaterThan(early.altitude);
    });

    it('is airborne with a heading toward JFK', () => {
      const metrics = calculateMetrics(55);
      expect(metrics.heading).toBeGreaterThan(50);
      expect(metrics.heading).toBeLessThan(80);
    });
  });

  describe('cruise phase (70-280 min)', () => {
    it('maintains cruise altitude around 35,000 ft', () => {
      const metrics = calculateMetrics(150);
      expect(metrics.phase).toBe(FlightPhase.Cruise);
      expect(metrics.altitude).toBe(35000);
    });

    it('maintains cruise speed of ~460 knots', () => {
      const metrics = calculateMetrics(200);
      expect(metrics.airspeed).toBe(460);
    });

    it('temperature at cruise altitude follows ISA model', () => {
      const metrics = calculateMetrics(150);
      expect(metrics.outsideAirTemperature).toBeLessThan(-50);
    });

    it('position progresses east during cruise', () => {
      const early = calculateMetrics(100);
      const late = calculateMetrics(250);
      expect(late.position.longitude).toBeGreaterThan(early.position.longitude);
    });
  });

  describe('descent phase (280-305 min)', () => {
    it('decreases altitude during descent', () => {
      const early = calculateMetrics(285);
      const late = calculateMetrics(300);
      expect(late.altitude).toBeLessThan(early.altitude);
    });
  });

  describe('landing phase (305-310 min)', () => {
    it('transitions to landing', () => {
      const metrics = calculateMetrics(306);
      expect(metrics.phase).toBe(FlightPhase.Landing);
    });

    it('reaches ground level by end of landing', () => {
      const metrics = calculateMetrics(309.9);
      expect(metrics.altitude).toBeLessThan(100);
    });
  });

  describe('taxi in phase (310-320 min)', () => {
    it('transitions to taxi in', () => {
      const metrics = calculateMetrics(311);
      expect(metrics.phase).toBe(FlightPhase.TaxiIn);
      expect(metrics.altitude).toBe(0);
    });

    it('position is at JFK', () => {
      const metrics = calculateMetrics(315);
      expect(metrics.position.latitude).toBeCloseTo(JFK.latitude, 2);
      expect(metrics.position.longitude).toBeCloseTo(JFK.longitude, 2);
    });
  });

  describe('arrived state', () => {
    it('reports arrived phase after flight completes', () => {
      const metrics = calculateMetrics(TOTAL_FLIGHT_DURATION + 1);
      expect(metrics.phase).toBe(FlightPhase.Arrived);
      expect(metrics.altitude).toBe(0);
      expect(metrics.airspeed).toBe(0);
      expect(metrics.eta).toBe(0);
    });

    it('final position is at JFK', () => {
      const metrics = calculateMetrics(TOTAL_FLIGHT_DURATION);
      expect(metrics.position.latitude).toBeCloseTo(JFK.latitude, 2);
      expect(metrics.position.longitude).toBeCloseTo(JFK.longitude, 2);
    });
  });

  describe('fuel consumption', () => {
    it('starts near 100%', () => {
      const metrics = calculateMetrics(0);
      expect(metrics.fuelRemaining).toBeGreaterThan(99);
    });

    it('decreases over time', () => {
      const early = calculateMetrics(10);
      const late = calculateMetrics(200);
      expect(late.fuelRemaining).toBeLessThan(early.fuelRemaining);
    });

    it('never goes below 0', () => {
      const metrics = calculateMetrics(TOTAL_FLIGHT_DURATION);
      expect(metrics.fuelRemaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ETA', () => {
    it('starts at total flight duration', () => {
      const metrics = calculateMetrics(0);
      expect(metrics.eta).toBe(TOTAL_FLIGHT_DURATION);
    });

    it('decreases as flight progresses', () => {
      const metrics = calculateMetrics(100);
      expect(metrics.eta).toBe(TOTAL_FLIGHT_DURATION - 100);
    });

    it('reaches 0 at completion', () => {
      const metrics = calculateMetrics(TOTAL_FLIGHT_DURATION);
      expect(metrics.eta).toBe(0);
    });
  });
});
