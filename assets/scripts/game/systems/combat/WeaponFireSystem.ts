import { Prefab } from 'cc';
import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import { Query } from '../../../core/ecs/Query';
import {
    C_ATTACK_TIMER,
    C_AUTO_AIM,
    C_PLAYER_TAG,
    C_POSITION,
    C_WEAPON_SLOTS,
} from '../../../core/ecs/ComponentTypes';
import { AttackTimer } from '../../components/weapon/AttackTimer';
import { AutoAim } from '../../components/weapon/AutoAim';
import { Position } from '../../components/common/Position';
import { WeaponSlots } from '../../components/player/WeaponSlots';
import { ProjectileFactory } from '../../factory/ProjectileFactory';

/**
 * 无用
 */
export class WeaponFireSystem extends System {
    private _projectilePrefab: Prefab | null;

    constructor(projectilePrefab: Prefab | null) {
        super();
        this.priority = 50;
        this._projectilePrefab = projectilePrefab;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        if (!this._projectilePrefab) return;
        if (!ctx.bulletLayer) return;

        const players = Query.all(
            world,
            C_PLAYER_TAG,
            C_POSITION,
            C_AUTO_AIM,
            C_ATTACK_TIMER,
            C_WEAPON_SLOTS
        );

        for (const entity of players) {
            const position = world.requireComponent<Position>(entity, C_POSITION);
            const autoAim = world.requireComponent<AutoAim>(entity, C_AUTO_AIM);
            const attackTimer = world.requireComponent<AttackTimer>(entity, C_ATTACK_TIMER);
            const weaponSlots = world.requireComponent<WeaponSlots>(entity, C_WEAPON_SLOTS);

            attackTimer.cooldown -= dt;

            if (attackTimer.cooldown > 0) {
                continue;
            }

            if (weaponSlots.weaponIds.length === 0) {
                continue;
            }

            const targetEntity = autoAim.targetEntity;
            if (!targetEntity || !world.hasEntity(targetEntity)) {
                continue;
            }

            const targetPos = world.getComponent<Position>(targetEntity, C_POSITION);
            if (!targetPos) {
                continue;
            }

            let dirX = targetPos.x - position.x;
            let dirY = targetPos.y - position.y;
            const len = Math.sqrt(dirX * dirX + dirY * dirY);

            if (len <= 0.0001) {
                continue;
            }

            dirX /= len;
            dirY /= len;

            ProjectileFactory.create(
                ctx,
                world,
                this._projectilePrefab,
                ctx.bulletLayer,
                position.x,
                position.y,
                dirX,
                dirY,
                520,
                10
            );

            attackTimer.cooldown = attackTimer.interval;
        }
    }
}