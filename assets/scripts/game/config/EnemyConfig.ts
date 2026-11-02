import { EnemyBehaviorType } from "../components/enemy/EnemyBehaviorType";

export interface EnemyConfigData {
    enemyId: number;
    name: string;

    prefabKey: string;

    maxHp: number;
    damage: number;

    minSpeed: number;
    maxSpeed: number;

    materialDropCount: number;
    consumableDropChance: number;
    chestDropChance: number;

    hpPerWave: number;
    damagePerWave: number;

    behaviorType: EnemyBehaviorType;
    skillCooldown: number;
    windupDuration: number;

    chargeDuration: number;
    chargeSpeed: number;

    shootBulletCount: number;
    shootSpreadAngle: number;
    shootBulletSpeed: number;
    projectileKey?: string;
}

export const EnemyConfigTable: Record<number, EnemyConfigData> = {
    3001: {
        enemyId: 3001,
        name: '普通追击怪',
        prefabKey: 'enemyChase',

        maxHp: 30,
        damage: 8,
        minSpeed: 90,
        maxSpeed: 130,

        materialDropCount: 1,
        consumableDropChance: 0.08,
        chestDropChance: 0.01,

        hpPerWave: 6,
        damagePerWave: 2,

        behaviorType: 'chase',
        skillCooldown: 0,
        windupDuration: 0,

        chargeDuration: 0,
        chargeSpeed: 0,

        shootBulletCount: 0,
        shootSpreadAngle: 0,
        shootBulletSpeed: 0,
    },

    3002: {
        enemyId: 3002,
        name: '冲锋怪',
        prefabKey: 'enemyCharger',

        maxHp: 40,
        damage: 12,
        minSpeed: 80,
        maxSpeed: 100,

        materialDropCount: 2,
        consumableDropChance: 0.1,
        chestDropChance: 0.015,

        hpPerWave: 8,
        damagePerWave: 2,

        behaviorType: 'charger',
        skillCooldown: 3.0,
        windupDuration: 0.5,

        chargeDuration: 0.35,
        chargeSpeed: 550,

        shootBulletCount: 0,
        shootSpreadAngle: 0,
        shootBulletSpeed: 0,
    },

    3003: {
        enemyId: 3003,
        name: '射击怪',
        prefabKey: 'enemyShooter',

        maxHp: 22,
        damage: 6,
        minSpeed: 70,
        maxSpeed: 95,

        materialDropCount: 1,
        consumableDropChance: 0.08,
        chestDropChance: 0.01,

        hpPerWave: 5,
        damagePerWave: 1,

        behaviorType: 'shooter',
        skillCooldown: 2.5,
        windupDuration: 0.4,

        chargeDuration: 0,
        chargeSpeed: 0,

        shootBulletCount: 3,
        shootSpreadAngle: 30,
        shootBulletSpeed: 280,
        projectileKey: 'enemyBulletBasic',
    },
};