import { config } from './config';
import { createDatabase } from './repository/database';
import { SQLiteFlightRepository } from './repository/sqlite-flight-repository';
import { SimulationEngine } from './simulation/simulation-engine';
import { createApp } from './app';

const db = createDatabase(config.dbPath);
const repository = new SQLiteFlightRepository(db);
const engine = new SimulationEngine(repository);

engine.resumeAll();

const app = createApp(repository, engine);

app.listen(config.port, () => {
  console.log(`Flight Status Simulator running on port ${config.port}`);
});
