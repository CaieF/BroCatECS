import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import { Query } from '../../../core/ecs/Query';
import { CollisionMath } from '../../../core/math/CollisionMath';
import {
    C_CAMP,
    C_COLLIDER,
    C_CONTACT_DAMAGE,
    C_DAMAGE,
    C_DEAD_TAG,
    C_DESTROY_TAG,
    C_ENEMY_TAG,
    C_HEALTH,
    C_LIFE_TIME,
    C_PLAYER_TAG,
    C_POSITION,
    C_PREVIOUS_POSITION,
    C_PROJECTILE_TAG,
} from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { PreviousPosition } from '../../components/common/PreviousPosition';
import { Collider } from '../../components/common/Collider';
import { LifeTime } from '../../components/common/LifeTime';
import { Health } from '../../components/actor/Health';
import { Damage } from '../../components/projectile/Damage';
import { E_DAMAGE } from '../../event/GameEventTypes';
import { DamageEvent } from '../../event/DamageEvent';
import { Camp, CampType } from '../../components/common/Camp';
import { ContactDamage } from '../../components/enemy/ContactDamage';

export class CollisionSystem extends System {
    constructor() {
        super();
        this.priority = 70;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        this.handleProjectileCollision(world);
        this.handleEnemyContactPlayer(world, dt);
        this.recycleExpiredProjectiles(world);
    }

    private handleProjectileCollision(world: World): void {
        const projectiles = Query.exclude(
            world,
            [C_PROJECTILE_TAG, C_POSITION, C_COLLIDER, C_DAMAGE, C_CAMP],
            [C_DESTROY_TAG]
        );
        const enemies = this.livingActors(world, C_ENEMY_TAG);
        const players = this.livingActors(world, C_PLAYER_TAG);

        for (const projectileEntity of projectiles) {
            const projectilePos = world.requireComponent<Position>(projectileEntity, C_POSITION);
            const projectileStart = world.getComponent<PreviousPosition>(projectileEntity, C_PREVIOUS_POSITION) ?? projectilePos;
            const projectileCol = world.requireComponent<Collider>(projectileEntity, C_COLLIDER);
            const damage = world.requireComponent<Damage>(projectileEntity, C_DAMAGE);
            const camp = world.requireComponent<Camp>(projectileEntity, C_CAMP);
            const targets = camp.value === CampType.Player ? enemies : camp.value === CampType.Enemy ? players : [];
            const travelFraction = (projectileStart as PreviousPosition).travelFraction ?? 1;
            let firstTarget = 0;
            let firstTime = Infinity;

            for (const targetEntity of targets) {
                const targetPos = world.requireComponent<Position>(targetEntity, C_POSITION);
                const targetStart = world.getComponent<PreviousPosition>(targetEntity, C_PREVIOUS_POSITION) ?? targetPos;
                const targetCol = world.requireComponent<Collider>(targetEntity, C_COLLIDER);
                // Stop the target's path at the bullet's expiry time, too.
                const targetEndX = targetStart.x + (targetPos.x - targetStart.x) * travelFraction;
                const targetEndY = targetStart.y + (targetPos.y - targetStart.y) * travelFraction;
                const hitTime = CollisionMath.segmentCircleFirstHit(
                    projectileStart.x - targetStart.x, projectileStart.y - targetStart.y,
                    projectilePos.x - targetEndX, projectilePos.y - targetEndY,
                    0, 0, projectileCol.radius + targetCol.radius
                );
                if (hitTime !== null && hitTime < firstTime) {
                    firstTime = hitTime;
                    firstTarget = targetEntity;
                }
            }

            if (firstTarget === 0) continue;
            const evt: DamageEvent = {
                sourceEntity: projectileEntity,
                targetEntity: firstTarget,
                value: damage.value,
            };
            world.eventBus.emit(E_DAMAGE, evt);
            // Keep the impact point available to views/effects until DestroySystem recycles the node.
            projectilePos.x = projectileStart.x + (projectilePos.x - projectileStart.x) * firstTime;
            projectilePos.y = projectileStart.y + (projectilePos.y - projectileStart.y) * firstTime;
            world.addComponent(projectileEntity, C_DESTROY_TAG, true);
        }
    }

    private handleEnemyContactPlayer(world: World, dt: number): void {
        const enemies = this.livingActors(world, C_ENEMY_TAG);
        const players = this.livingActors(world, C_PLAYER_TAG);
        for (const enemyEntity of enemies) {
            const contactDamage = world.getComponent<ContactDamage>(enemyEntity, C_CONTACT_DAMAGE);
            if (!contactDamage) continue;
            const readyFraction = dt > 0 ? Math.min(1, Math.max(0, contactDamage.cooldown / dt)) : 0;
            contactDamage.cooldown = Math.max(0, contactDamage.cooldown - Math.max(0, dt));
            if (contactDamage.cooldown > 0) continue;

            const enemyPos = world.requireComponent<Position>(enemyEntity, C_POSITION);
            const enemyStart = world.getComponent<PreviousPosition>(enemyEntity, C_PREVIOUS_POSITION) ?? enemyPos;
            const enemyCol = world.requireComponent<Collider>(enemyEntity, C_COLLIDER);
            for (const playerEntity of players) {
                const playerPos = world.requireComponent<Position>(playerEntity, C_POSITION);
                const playerStart = world.getComponent<PreviousPosition>(playerEntity, C_PREVIOUS_POSITION) ?? playerPos;
                const playerCol = world.requireComponent<Collider>(playerEntity, C_COLLIDER);
                // A crossing before the contact cooldown ends cannot deal damage retroactively.
                if (CollisionMath.segmentCircleFirstHit(
                    enemyStart.x - playerStart.x + ((enemyPos.x - enemyStart.x) - (playerPos.x - playerStart.x)) * readyFraction,
                    enemyStart.y - playerStart.y + ((enemyPos.y - enemyStart.y) - (playerPos.y - playerStart.y)) * readyFraction,
                    enemyPos.x - playerPos.x, enemyPos.y - playerPos.y,
                    0, 0, enemyCol.radius + playerCol.radius
                ) === null) continue;

                const evt: DamageEvent = {
                    sourceEntity: enemyEntity,
                    targetEntity: playerEntity,
                    value: contactDamage.value,
                };
                world.eventBus.emit(E_DAMAGE, evt);
                contactDamage.cooldown = contactDamage.interval;
                break;
            }
        }
    }

    private livingActors(world: World, tag: string): number[] {
        return Query.exclude(
            world, [tag, C_POSITION, C_COLLIDER, C_HEALTH], [C_DEAD_TAG, C_DESTROY_TAG]
        ).filter(entity => world.requireComponent<Health>(entity, C_HEALTH).current > 0);
    }

    private recycleExpiredProjectiles(world: World): void {
        const projectiles = Query.exclude(world, [C_PROJECTILE_TAG, C_LIFE_TIME], [C_DESTROY_TAG]);
        for (const entity of projectiles) {
            if (world.requireComponent<LifeTime>(entity, C_LIFE_TIME).remaining <= 0) {
                world.addComponent(entity, C_DESTROY_TAG, true);
            }
        }
    }
}
