import * as SQLite from 'expo-sqlite';

export interface PotholeRecord {
    id?: number;
    latitude: number;
    longitude: number;
    confidence: number; // 0-1
    vision_hit: number; // 0 or 1
    vibration_hit: number; // 0 or 1
    severity: 'high' | 'medium' | 'low';
    timestamp: number; // unix ms
    session_id: string;
}

let db: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
    if (!db) {
        db = await SQLite.openDatabaseAsync('patchpoint.db');
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS potholes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        confidence REAL NOT NULL,
        vision_hit INTEGER NOT NULL DEFAULT 0,
        vibration_hit INTEGER NOT NULL DEFAULT 0,
        severity TEXT NOT NULL DEFAULT 'low',
        timestamp INTEGER NOT NULL,
        session_id TEXT NOT NULL
      );
    `);
    }
    return db;
}

export async function insertPothole(record: Omit<PotholeRecord, 'id'>): Promise<number> {
    const database = await getDB();
    const result = await database.runAsync(
        `INSERT INTO potholes (latitude, longitude, confidence, vision_hit, vibration_hit, severity, timestamp, session_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        record.latitude,
        record.longitude,
        record.confidence,
        record.vision_hit ? 1 : 0,
        record.vibration_hit ? 1 : 0,
        record.severity,
        record.timestamp,
        record.session_id
    );
    return result.lastInsertRowId;
}

export async function getAllPotholes(): Promise<PotholeRecord[]> {
    const database = await getDB();
    return database.getAllAsync<PotholeRecord>(
        'SELECT * FROM potholes ORDER BY timestamp DESC'
    );
}

export async function getPotholesForSession(sessionId: string): Promise<PotholeRecord[]> {
    const database = await getDB();
    return database.getAllAsync<PotholeRecord>(
        'SELECT * FROM potholes WHERE session_id = ? ORDER BY timestamp DESC',
        sessionId
    );
}

export async function clearPotholes(): Promise<void> {
    const database = await getDB();
    await database.execAsync('DELETE FROM potholes');
}

export async function getPotholeStats(): Promise<{
    total: number;
    high: number;
    medium: number;
    low: number;
}> {
    const database = await getDB();
    const rows = await database.getAllAsync<{ severity: string; count: number }>(
        'SELECT severity, COUNT(*) as count FROM potholes GROUP BY severity'
    );
    const stats = { total: 0, high: 0, medium: 0, low: 0 };
    rows.forEach((r) => {
        stats[r.severity as 'high' | 'medium' | 'low'] = r.count;
        stats.total += r.count;
    });
    return stats;
}
