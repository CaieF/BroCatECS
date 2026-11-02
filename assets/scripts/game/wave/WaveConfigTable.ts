import { WaveConfig } from './WaveConfig';

export const WaveConfigTable: WaveConfig[] = [
    {
        wave: 1,
        duration: 15,
        entries: [
            { enemyId: 3001, count: 1, interval: 1.2 },
        ],
    },
    {
        wave: 2,
        duration: 20,
        entries: [
            { enemyId: 3001, count: 2, interval: 1.0 },
            { enemyId: 3002, count: 1, interval: 4.0 },
        ],
    },
    {
        wave: 3,
        duration: 25,
        entries: [
            { enemyId: 3001, count: 2, interval: 0.9 },
            { enemyId: 3002, count: 1, interval: 3.5 },
            { enemyId: 3003, count: 1, interval: 4.5 },
        ],
    },
];