import { instantiate, Node, Prefab, randomRange } from 'cc';
import { World } from '../../core/ecs/World';
import {
    C_ANIM_STATE,
    C_CAMP,
    C_COLLIDER,
    C_CONTACT_DAMAGE,
    C_ENEMY_AI,
    C_ENEMY_IDENTITY,
    C_ENEMY_SKILL_CONFIG,
    C_ENEMY_STATE_MACHINE,
    C_ENEMY_STATS,
    C_ENEMY_TAG,
    C_FACING,
    C_HEALTH,
    C_HURT_FLASH,
    C_MOVE_DIRECTION,
    C_POSITION,
    C_VELOCITY,
    C_VIEW_REF,
} from '../../core/ecs/ComponentTypes';
import { Entity } from '../../core/ecs/Entity';
import { Position } from '../components/common/Position';
import { Velocity } from '../components/common/Velocity';
import { ViewRef } from '../components/common/ViewRef';
import { EnemyAI } from '../components/enemy/EnemyAI';
import { Health } from '../components/actor/Health';
import { Collider } from '../components/common/Collider';
import { MoveDirection } from '../components/common/MoveDirection';
import { Facing } from '../components/common/Facing';
import { AnimState } from '../components/common/AnimState';
import { HurtFlash } from '../components/actor/HurtFlash';
import { EnemyConfigTable } from '../config/EnemyConfig';
import { EnemyIdentity } from '../components/enemy/EnemyIdentity';
import { EnemyStats } from '../components/enemy/EnemyStats';
import { EnemySkillConfig } from '../components/enemy/EnemySkillConfig';
import { EnemyStateMachine } from '../components/enemy/EnemyStateMachine';
import { Camp, CampType } from '../components/common/Camp';
import { ContactDamage } from '../components/enemy/ContactDamage';
import { EnemyPrefabLibrary } from '../config/EnemyPrefabLibrary';
import { BattleContext } from '../battle/BattleContext';

export class EnemyFactory {
    public static create(
        ctx: BattleContext,
        world: World,
        enemyLayer: Node,
        enemyId: number,
        wave: number,
        x: number,
        y: number
    ): Entity {
        const cfg = EnemyConfigTable[enemyId];
        if (!cfg) {
            throw new Error(`EnemyConfig not found: enemyId=${enemyId}`);
        }

        // const prefab = enemyPrefabLibrary.get(cfg.prefabKey);
        // if (!prefab) {
        //     throw new Error(`Enemy prefab not found: prefabKey=${cfg.prefabKey}`);
        // }

        const enemyNode = ctx.nodePool.get(cfg.prefabKey);
        if (!enemyNode) {
            throw new Error(`Enemy pool get failed: ${cfg.prefabKey}`);
        }
        enemyLayer.addChild(enemyNode);
        enemyNode.setPosition(x, y, 0);

        const entity = world.createEntity();

        const finalHp = cfg.maxHp + cfg.hpPerWave * Math.max(0, wave - 1);
        const finalDamage = cfg.damage + cfg.damagePerWave * Math.max(0, wave - 1);
        const finalMoveSpeed = randomRange(cfg.minSpeed, cfg.maxSpeed);

        const position: Position = { x, y };
        const velocity: Velocity = { x: 0, y: 0 };
        const viewRef: ViewRef = { node: enemyNode, poolKey: cfg.prefabKey };
        const enemyAI: EnemyAI = {
            moveType: 'chase',
        };
        const identity: EnemyIdentity = {
            enemyId,
        };

        const skillConfig: EnemySkillConfig = {
            behaviorType: cfg.behaviorType,
            skillCooldown: cfg.skillCooldown,
            windupDuration: cfg.windupDuration,

            chargeDuration: cfg.chargeDuration,
            chargeSpeed: cfg.chargeSpeed,

            shootBulletCount: cfg.shootBulletCount,
            shootSpreadAngle: cfg.shootSpreadAngle,
            shootBulletSpeed: cfg.shootBulletSpeed,
        };

        const stateMachine: EnemyStateMachine = {
            state: 'chase',
            skillCooldownRemaining: cfg.skillCooldown,
            stateTimer: 0,
            lockedAimRad: 0,
            didAction: false,
        };

        const enemyStats: EnemyStats = {
            maxHp: finalHp,
            damage: finalDamage,
            moveSpeed: finalMoveSpeed,
            materialDropCount: cfg.materialDropCount,
            consumableDropChance: cfg.consumableDropChance,
            chestDropChance: cfg.chestDropChance,
        };

        const health: Health = {
            current: finalHp,
            max: finalHp,
        };
        const collider: Collider = {
            radius: 22,
        };
        const moveDirection: MoveDirection = {
            x: 0,
            y: 0,
        };
        const facing: Facing = {
            value: 1,
        };
        const animState: AnimState = {
            current: 'idle',
            locked: false,
        };

        const hurtFlash: HurtFlash = {
            duration: 0.12,
            remaining: 0,
            active: false,
        };

        const camp: Camp = {
            value: CampType.Enemy,
        };
        
        const contactDamage: ContactDamage = {
            value: finalDamage,
            interval: 0.5,
            cooldown: 0,
        };

        world.addComponent(entity, C_ENEMY_TAG, true);
        world.addComponent(entity, C_POSITION, position);
        world.addComponent(entity, C_VELOCITY, velocity);
        world.addComponent(entity, C_VIEW_REF, viewRef);

        world.addComponent(entity, C_ENEMY_AI, enemyAI);
        world.addComponent(entity, C_ENEMY_IDENTITY, identity);
        world.addComponent(entity, C_ENEMY_STATS, enemyStats);

        world.addComponent(entity, C_HEALTH, health);
        world.addComponent(entity, C_COLLIDER, collider);

        world.addComponent(entity, C_MOVE_DIRECTION, moveDirection);
        world.addComponent(entity, C_FACING, facing);
        world.addComponent(entity, C_ANIM_STATE, animState);
        world.addComponent(entity, C_HURT_FLASH, hurtFlash);

        world.addComponent(entity, C_ENEMY_SKILL_CONFIG, skillConfig);
        world.addComponent(entity, C_ENEMY_STATE_MACHINE, stateMachine);

        world.addComponent(entity, C_CAMP, camp);
        world.addComponent(entity, C_CONTACT_DAMAGE, contactDamage);
        
        return entity;
    }
}