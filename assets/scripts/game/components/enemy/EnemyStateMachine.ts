export type EnemyState = 'chase' | 'windup' | 'charge' | 'shoot';

export interface EnemyStateMachine {
    state: EnemyState;

    skillCooldownRemaining: number;
    stateTimer: number;

    lockedAimRad: number;   // 技能锁定方向
    didAction: boolean;     // 防止shoot阶段重复发射
}