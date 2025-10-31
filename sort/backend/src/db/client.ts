import Database from 'better-sqlite3';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(`${__dirname}/../../database.sqlite`);

db.pragma('journal_mode = WAL');

export default db;
