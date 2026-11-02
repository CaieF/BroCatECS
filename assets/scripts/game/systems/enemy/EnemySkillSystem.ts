import { Prefab, Vec3 } from 'cc';
import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_DEAD_TAG,
    C_ENEMY_IDENTITY,
    C_ENEMY_SKILL_CONFIG,
    C_ENEMY_STATE_MACHINE,
    C_ENEMY_TAG,
    C_POSITION,
    C_VELOCITY,
    C_VIEW_REF,
} from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { Velocity } from '../../components/common/Velocity';
import { EnemySkillConfig } from '../../components/enemy/EnemySkillConfig';
import { EnemyStateMachine } from '../../components/enemy/EnemyStateMachine';
import { ProjectileFactory } from '../../factory/ProjectileFactory';
import { CampType } from '../../components/common/Camp';
import { EnemyIdentity } from '../../components/enemy/EnemyIdentity';
import { EnemyConfigTable } from '../../config/EnemyConfig';
import { ViewRef } from '../../components/common/ViewRef';
import { EnemyView } from '../../view/EnemyView';

const _tempWorldPos = new Vec3();

export class EnemySkillSystem extends System {
    // private _projectilePrefab: Prefab | null;

    constructor() {
        super();
        this.priority = 31;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const playerEntity = ctx.playerEntity;
        if (!playerEntity || !world.hasEntity(playerEntity)) return;
        if (!world.hasComponent(playerEntity, C_POSITION)) return;

        const playerPos = world.requireComponent<Position>(playerEntity, C_POSITION);

        const enemies = Query.exclude(
            world,
            [C_ENEMY_TAG, C_ENEMY_SKILL_CONFIG, C_ENEMY_STATE_MACHINE, C_POSITION, C_VELOCITY, C_ENEMY_IDENTITY, C_VIEW_REF],
            [C_DEAD_TAG]
        );

        for (const entity of enemies) {
            const pos = world.requireComponent<Position>(entity, C_POSITION);
            const vel = world.requireComponent<Velocity>(entity, C_VELOCITY);
            const cfg = world.requireComponent<EnemySkillConfig>(entity, C_ENEMY_SKILL_CONFIG);
            const sm = world.requireComponent<EnemyStateMachine>(entity, C_ENEMY_STATE_MACHINE);

            if (cfg.behaviorType === 'chase') {
                continue;
            }

            if (sm.state === 'chase') {
                sm.skillCooldownRemaining -= dt;

                if (sm.skillCooldownRemaining <= 0) {
                    const dx = playerPos.x - pos.x;
                    const dy = playerPos.y - pos.y;
                    sm.lockedAimRad = Math.atan2(dy, dx);

                    sm.state = 'windup';
                    sm.stateTimer = cfg.windupDuration;
                    sm.didAction = false;

                    vel.x = 0;
                    vel.y = 0;
                }

                continue;
            }

            if (sm.state === 'windup') {
                sm.stateTimer -= dt;
                vel.x = 0;
                vel.y = 0;

                if (sm.stateTimer <= 0) {
                    if (cfg.behaviorType === 'charger') {
                        sm.state = 'charge';
                        sm.stateTimer = cfg.chargeDuration;
                    } else if (cfg.behaviorType === 'shooter') {
                        sm.state = 'shoot';
                        sm.stateTimer = 0.1;
                    }
                }

                continue;
            }

            if (sm.state === 'charge') {
                const dirX = Math.cos(sm.lockedAimRad);
                const dirY = Math.sin(sm.lockedAimRad);

                vel.x = dirX * cfg.chargeSpeed;
                vel.y = dirY * cfg.chargeSpeed;

                pos.x += vel.x * dt;
                pos.y += vel.y * dt;

                sm.stateTimer -= dt;
                if (sm.stateTimer <= 0) {
                    vel.x = 0;
                    vel.y = 0;
                    sm.state = 'chase';
                    sm.skillCooldownRemaining = cfg.skillCooldown;
                }

                continue;
            }

            if (sm.state === 'shoot') {
                vel.x = 0;
                vel.y = 0;

                if (!sm.didAction) {
                    // this.fireFanBullets(world, ctx, pos, sm.lockedAimRad, cfg);
                    this.fireFanBullets(world, ctx, entity, pos, sm.lockedAimRad, cfg);
                    sm.didAction = true;
                }

                sm.stateTimer -= dt;
                if (sm.stateTimer <= 0) {
                    sm.state = 'chase';
                    sm.skillCooldownRemaining = cfg.skillCooldown;
                }

                continue;
            }
        }
    }

    private fireFanBullets(
    world: World,
    ctx: BattleContext,
    enemyEntity: number,
    pos: Position,
    aimRad: number,
    cfg: EnemySkillConfig
): void {
    if (!ctx.bulletLayer) return;

    const identity = world.requireComponent<EnemyIdentity>(enemyEntity, C_ENEMY_IDENTITY);
    const enemyCfg = EnemyConfigTable[identity.enemyId];
    const projectileKey = enemyCfg.projectileKey;
    if (!projectileKey) {
        console.warn(`[EnemySkillSystem] enemy ${identity.enemyId} has no projectileKey`);
        return;
    }

    let spawnX = pos.x;
    let spawnY = pos.y;

    const viewRef = world.getComponent<ViewRef>(enemyEntity, C_VIEW_REF);
    if (viewRef?.node && viewRef.node.isValid) {
        const enemyView = viewRef.node.getComponent(EnemyView);
        if (enemyView) {
            enemyView.getShootWorldPosition(_tempWorldPos);
            spawnX = _tempWorldPos.x;
            spawnY = _tempWorldPos.y;
        }
    }

    const count = Math.max(1, cfg.shootBulletCount);
    const totalSpreadRad = cfg.shootSpreadAngle * Math.PI / 180;

    if (count === 1) {
        ProjectileFactory.create(
            ctx,
            world,
            // ctx.projectilePrefabLibrary,
            projectileKey,
            ctx.bulletLayer,
            spawnX,
            spawnY,
            Math.cos(aimRad),
            Math.sin(aimRad),
            cfg.shootBulletSpeed,
            8,
            CampType.Enemy
        );
        return;
    }

    const start = aimRad - totalSpreadRad * 0.5;
    const step = totalSpreadRad / (count - 1);

    for (let i = 0; i < count; i++) {
        const rad = start + step * i;

        ProjectileFactory.create(
            ctx,
            world,  
            // ctx.projectilePrefabLibrary,
            projectileKey,
            ctx.bulletLayer,
            spawnX,
            spawnY,
            Math.cos(rad),
            Math.sin(rad),
            cfg.shootBulletSpeed,
            8,
            CampType.Enemy
        );
    }
}
}