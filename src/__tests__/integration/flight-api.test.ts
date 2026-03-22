import request from 'supertest';
import Database from 'better-sqlite3';
import { createApp } from '../../app';
import { SQLiteFlightRepository } from '../../repository/sqlite-flight-repository';
import { SimulationEngine } from '../../simulation/simulation-engine';

function setupTestApp() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE flights (
      id TEXT PRIMARY KEY,
      callsign TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      time_scale REAL NOT NULL DEFAULT 60,
      started_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE TABLE metrics_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flight_id TEXT NOT NULL REFERENCES flights(id),
      phase TEXT NOT NULL,
      altitude REAL NOT NULL,
      airspeed REAL NOT NULL,
      heading REAL NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      fuel_remaining REAL NOT NULL,
      outside_air_temperature REAL NOT NULL,
      eta REAL NOT NULL,
      elapsed_minutes REAL NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  const repository = new SQLiteFlightRepository(db);
  const engine = new SimulationEngine(repository);
  const app = createApp(repository, engine);

  return { app, engine, db };
}

describe('Flight API', () => {
  let testContext: ReturnType<typeof setupTestApp>;

  beforeEach(() => {
    testContext = setupTestApp();
  });

  afterEach(() => {
    testContext.db.close();
  });

  describe('POST /flights', () => {
    it('creates a new flight simulation', async () => {
      const res = await request(testContext.app)
        .post('/flights')
        .send({ callsign: 'TEST01', timeScale: 60 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.callsign).toBe('TEST01');
      expect(res.body.status).toBe('active');
      expect(res.body.timeScale).toBe(60);

      testContext.engine.stop(res.body.id);
    });

    it('uses defaults when no body is provided', async () => {
      const res = await request(testContext.app)
        .post('/flights')
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.callsign).toBe('SIM001');
      expect(res.body.timeScale).toBe(60);

      testContext.engine.stop(res.body.id);
    });

    it('rejects invalid callsign format', async () => {
      const res = await request(testContext.app)
        .post('/flights')
        .send({ callsign: 'invalid-!@#' });

      expect(res.status).toBe(400);
    });

    it('rejects timeScale out of range', async () => {
      const res = await request(testContext.app)
        .post('/flights')
        .send({ timeScale: 500 });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /flights', () => {
    it('returns an empty array when no flights exist', async () => {
      const res = await request(testContext.app).get('/flights');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns all created flights', async () => {
      const create1 = await request(testContext.app)
        .post('/flights')
        .send({ callsign: 'FL001' });
      const create2 = await request(testContext.app)
        .post('/flights')
        .send({ callsign: 'FL002' });

      const res = await request(testContext.app).get('/flights');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);

      testContext.engine.stop(create1.body.id);
      testContext.engine.stop(create2.body.id);
    });
  });

  describe('GET /flights/:id', () => {
    it('returns flight details with current metrics', async () => {
      const created = await request(testContext.app)
        .post('/flights')
        .send({});

      const res = await request(testContext.app)
        .get(`/flights/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
      expect(res.body.currentMetrics).toBeDefined();

      testContext.engine.stop(created.body.id);
    });

    it('returns 404 for non-existent flight', async () => {
      const res = await request(testContext.app)
        .get('/flights/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Flight not found');
    });

    it('returns 400 for invalid UUID format', async () => {
      const res = await request(testContext.app)
        .get('/flights/not-a-uuid');

      expect(res.status).toBe(400);
    });
  });

  describe('GET /flights/:id/history', () => {
    it('returns metric history for a flight', async () => {
      const created = await request(testContext.app)
        .post('/flights')
        .send({});

      // Wait for at least one tick
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const res = await request(testContext.app)
        .get(`/flights/${created.body.id}/history`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('phase');
      expect(res.body[0]).toHaveProperty('altitude');
      expect(res.body[0]).toHaveProperty('position');

      testContext.engine.stop(created.body.id);
    });

    it('returns 404 for non-existent flight', async () => {
      const res = await request(testContext.app)
        .get('/flights/00000000-0000-0000-0000-000000000000/history');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /health', () => {
    it('returns ok status', async () => {
      const res = await request(testContext.app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });
});
