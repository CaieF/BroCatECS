export interface WaveSpawnEntry {
    enemyId: number;
    count: number;
    interval: number;
}

export interface WaveConfig {
    wave: number;
    duration: number;
    entries: WaveSpawnEntry[];
}