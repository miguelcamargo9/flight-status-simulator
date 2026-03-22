# Flight Status Simulator

REST API service that simulates a commercial flight from LAX to JFK, exposing real-time flight metrics including altitude, airspeed, position, fuel consumption, and more.

## Architecture

```
src/
  domain/         # Types, enums, and phase configuration data
  simulation/     # Metrics calculator (pure functions) and simulation engine
  repository/     # Database interface and SQLite implementation
  api/            # Express routes, controllers, validation, and error handling
```

### Design Decisions

- **Data-driven phase modeling**: Flight phases are defined as configuration objects with duration, altitude range, speed range, and fuel burn rate. A single pure function interpolates all metrics from elapsed time — no class hierarchy needed.
- **Repository pattern**: Database access is abstracted behind an interface, making the persistence layer swappable and testable.
- **Wall-clock elapsed time**: Metrics are computed from actual elapsed wall-clock time (`Date.now() - startedAt`) multiplied by the time scale, avoiding timer drift issues.
- **Great-circle interpolation**: Aircraft position follows a spherical interpolation between LAX and JFK coordinates, with heading computed as the forward azimuth toward JFK.
- **ISA temperature model**: Outside air temperature follows the International Standard Atmosphere model (−2°C per 1,000 ft, capped at −56.5°C).
- **Simulation resume**: Active simulations are automatically resumed on server restart by querying the database for in-progress flights.

### Assumptions

- Default time scale is 60 (1 real second = 1 simulated minute), making a 320-minute flight complete in ~5.3 real minutes.
- Fuel is tracked as a percentage (0–100%), not gallons.
- The flight route is fixed (LAX → JFK). The API does not accept custom origin/destination.
- Metrics are snapshot every real second (one simulated minute at default scale).

## Setup

### Prerequisites

- Node.js 20+
- npm

### Local Development

```bash
# Install dependencies
npm install

# Start in development mode (auto-reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build and run
docker compose up --build

# Stop
docker compose down
```

The server starts on port `3000` by default. Configure via environment variables or `.env` file (see `.env.example`).

## API Usage

### Start a new flight simulation

```bash
curl -X POST http://localhost:3000/flights \
  -H "Content-Type: application/json" \
  -d '{"callsign": "UA100", "timeScale": 60}'
```

Both fields are optional. Defaults: `callsign: "SIM001"`, `timeScale: 60`.

`timeScale` controls simulation speed: `60` means 1 real second = 1 simulated minute.

### List all flights

```bash
curl http://localhost:3000/flights
```

### Get current flight status

```bash
curl http://localhost:3000/flights/{id}
```

Response includes the latest metrics snapshot:

```json
{
  "id": "uuid",
  "callsign": "UA100",
  "status": "active",
  "timeScale": 60,
  "startedAt": "2025-01-01T00:00:00.000Z",
  "completedAt": null,
  "currentMetrics": {
    "phase": "cruise",
    "altitude": 35000,
    "airspeed": 460,
    "heading": 66.3,
    "position": { "latitude": 38.12, "longitude": -98.45 },
    "fuelRemaining": 72.5,
    "outsideAirTemperature": -55.0,
    "eta": 185,
    "elapsedMinutes": 135,
    "timestamp": "2025-01-01T00:02:15.000Z"
  }
}
```

### Get full metric history

```bash
curl http://localhost:3000/flights/{id}/history
```

### Real-time streaming (SSE)

```bash
curl -N http://localhost:3000/flights/{id}/stream
```

Streams metrics as Server-Sent Events. Each event contains a JSON metrics snapshot.

### API Documentation

Interactive Swagger UI available at: `http://localhost:3000/api-docs`

## Testing

> Tests were generated with AI assistance.

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DB_PATH` | `./data/flights.db` | SQLite database file path |
| `TIME_SCALE` | `60` | Default simulation time scale |
| `NODE_ENV` | `development` | Environment mode |
