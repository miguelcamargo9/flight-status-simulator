import { intermediatePoint, forwardAzimuth } from '../../simulation/geo';

const LAX = { latitude: 33.9425, longitude: -118.4081 };
const JFK = { latitude: 40.6413, longitude: -73.7781 };

describe('intermediatePoint', () => {
  it('returns origin at fraction 0', () => {
    const point = intermediatePoint(LAX, JFK, 0);
    expect(point.latitude).toBeCloseTo(LAX.latitude, 2);
    expect(point.longitude).toBeCloseTo(LAX.longitude, 2);
  });

  it('returns destination at fraction 1', () => {
    const point = intermediatePoint(LAX, JFK, 1);
    expect(point.latitude).toBeCloseTo(JFK.latitude, 2);
    expect(point.longitude).toBeCloseTo(JFK.longitude, 2);
  });

  it('returns a midpoint in the continental US at fraction 0.5', () => {
    const point = intermediatePoint(LAX, JFK, 0.5);
    expect(point.latitude).toBeGreaterThan(37);
    expect(point.latitude).toBeLessThan(42);
    expect(point.longitude).toBeGreaterThan(-105);
    expect(point.longitude).toBeLessThan(-90);
  });

  it('returns the same point when origin equals destination', () => {
    const point = intermediatePoint(LAX, LAX, 0.5);
    expect(point.latitude).toBeCloseTo(LAX.latitude, 2);
    expect(point.longitude).toBeCloseTo(LAX.longitude, 2);
  });
});

describe('forwardAzimuth', () => {
  it('computes initial bearing from LAX to JFK (~66°)', () => {
    const bearing = forwardAzimuth(LAX, JFK);
    expect(bearing).toBeGreaterThan(60);
    expect(bearing).toBeLessThan(72);
  });

  it('returns ~0° for due-north direction', () => {
    const from = { latitude: 0, longitude: 0 };
    const to = { latitude: 10, longitude: 0 };
    const bearing = forwardAzimuth(from, to);
    expect(bearing).toBeCloseTo(0, 0);
  });

  it('returns ~90° for due-east direction', () => {
    const from = { latitude: 0, longitude: 0 };
    const to = { latitude: 0, longitude: 10 };
    const bearing = forwardAzimuth(from, to);
    expect(bearing).toBeCloseTo(90, 0);
  });
});
