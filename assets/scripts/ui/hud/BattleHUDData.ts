export interface BattleHUDData {
    hpCurrent: number;
    hpMax: number;

    expCurrent: number;
    expNeed: number;
    level: number;

    gold: number;
    material: number;

    waveIndex: number;
    waveTimeRemaining: number;

    hasPendingLevelUp: boolean;
}