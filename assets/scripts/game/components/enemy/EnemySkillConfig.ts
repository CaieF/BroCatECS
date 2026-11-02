import { EnemyBehaviorType } from './EnemyBehaviorType';

export interface EnemySkillConfig {
    behaviorType: EnemyBehaviorType;

    skillCooldown: number;
    windupDuration: number;

    // 冲锋怪
    chargeDuration: number;
    chargeSpeed: number;

    // 射击怪
    shootBulletCount: number;
    shootSpreadAngle: number;   // 角度制，例 30 表示总扇形30度
    shootBulletSpeed: number;
}