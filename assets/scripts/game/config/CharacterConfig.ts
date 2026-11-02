import { BaseStats } from '../components/actor/BaseStats';

export interface CharacterConfigData {
    characterId: number;
    name: string;
    baseMoveSpeed: number;
    baseStats: BaseStats;
}

export const CharacterConfigTable: Record<number, CharacterConfigData> = {
    1001: {
        characterId: 1001,
        name: '橘猫',
        baseMoveSpeed: 240,
        baseStats: {
            maxHp: 5 + 5000,
            hpRegen: 10,
            lifeSteal: 10,
            armor: 0,
            dodge: 0,
            speedPct: 5,
            meleeDamage: 0,
            rangedDamage: 0,
            elementalDamage: 0,
            engineering: 0,
            damagePct: 0,
            attackSpeedPct: 0,
            critChance: 0,
            range: 0,
            luck: 0,
            harvesting: 8,
        },
    },
};