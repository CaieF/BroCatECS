import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import { Query } from '../../../core/ecs/Query';
import {
    C_CAMP,
    C_COLLIDER,
    C_CONTACT_DAMAGE,
    C_DAMAGE,
    C_DESTROY_TAG,
    C_ENEMY_TAG,
    C_PLAYER_TAG,
    C_POSITION,
    C_PROJECTILE_TAG,
} from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { Collider } from '../../components/common/Collider';
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
    }

    private handleProjectileCollision(world: World): void {
        const projectiles = Query.exclude(
            world,
            [C_PROJECTILE_TAG, C_POSITION, C_COLLIDER, C_DAMAGE, C_CAMP],
            [C_DESTROY_TAG]
        );

        const enemies = Query.exclude(
            world,
            [C_ENEMY_TAG, C_POSITION, C_COLLIDER],
            [C_DESTROY_TAG]
        );

        const players = Query.exclude(
            world,
            [C_PLAYER_TAG, C_POSITION, C_COLLIDER],
            [C_DESTROY_TAG]
        );

        for (const projectileEntity of projectiles) {
            const projectilePos = world.requireComponent<Position>(projectileEntity, C_POSITION);
            const projectileCol = world.requireComponent<Collider>(projectileEntity, C_COLLIDER);
            const damage = world.requireComponent<Damage>(projectileEntity, C_DAMAGE);
            const camp = world.requireComponent<Camp>(projectileEntity, C_CAMP);

            if (camp.value === CampType.Player) {
                for (const enemyEntity of enemies) {
                    const enemyPos = world.requireComponent<Position>(enemyEntity, C_POSITION);
                    const enemyCol = world.requireComponent<Collider>(enemyEntity, C_COLLIDER);

                    if (this.isCircleOverlap(projectilePos, projectileCol.radius, enemyPos, enemyCol.radius)) {
                        const evt: DamageEvent = {
                            sourceEntity: projectileEntity,
                            targetEntity: enemyEntity,
                            value: damage.value,
                        };
                        world.eventBus.emit(E_DAMAGE, evt);

                        if (!world.hasComponent(projectileEntity, C_DESTROY_TAG)) {
                            world.addComponent(projectileEntity, C_DESTROY_TAG, true);
                        }
                        break;
                    }
                }
            } else if (camp.value === CampType.Enemy) {
                for (const playerEntity of players) {
                    const playerPos = world.requireComponent<Position>(playerEntity, C_POSITION);
                    const playerCol = world.requireComponent<Collider>(playerEntity, C_COLLIDER);

                    if (this.isCircleOverlap(projectilePos, projectileCol.radius, playerPos, playerCol.radius)) {
                        const evt: DamageEvent = {
                            sourceEntity: projectileEntity,
                            targetEntity: playerEntity,
                            value: damage.value,
                        };
                        world.eventBus.emit(E_DAMAGE, evt);

                        if (!world.hasComponent(projectileEntity, C_DESTROY_TAG)) {
                            world.addComponent(projectileEntity, C_DESTROY_TAG, true);
                        }
                        break;
                    }
                }
            }
        }
    }

    private handleEnemyContactPlayer(world: World, dt: number): void {
        const enemies = Query.exclude(
            world,
            [C_ENEMY_TAG, C_POSITION, C_COLLIDER, C_CONTACT_DAMAGE],
            [C_DESTROY_TAG]
        );

        const players = Query.exclude(
            world,
            [C_PLAYER_TAG, C_POSITION, C_COLLIDER],
            [C_DESTROY_TAG]
        );

        if (players.length === 0) return;

        const playerEntity = players[0];
        const playerPos = world.requireComponent<Position>(playerEntity, C_POSITION);
        const playerCol = world.requireComponent<Collider>(playerEntity, C_COLLIDER);

        for (const enemyEntity of enemies) {
            const enemyPos = world.requireComponent<Position>(enemyEntity, C_POSITION);
            const enemyCol = world.requireComponent<Collider>(enemyEntity, C_COLLIDER);
            const contactDamage = world.requireComponent<ContactDamage>(enemyEntity, C_CONTACT_DAMAGE);

            if (contactDamage.cooldown > 0) {
                contactDamage.cooldown -= dt;
                if (contactDamage.cooldown < 0) {
                    contactDamage.cooldown = 0;
                }
            }

            if (!this.isCircleOverlap(enemyPos, enemyCol.radius, playerPos, playerCol.radius)) {
                continue;
            }

            if (contactDamage.cooldown > 0) {
                continue;
            }

            const evt: DamageEvent = {
                sourceEntity: enemyEntity,
                targetEntity: playerEntity,
                value: contactDamage.value,
            };
            world.eventBus.emit(E_DAMAGE, evt);

            contactDamage.cooldown = contactDamage.interval;
        }
    }

    private isCircleOverlap(
        aPos: Position,
        aRadius: number,
        bPos: Position,
        bRadius: number
    ): boolean {
        const dx = bPos.x - aPos.x;
        const dy = bPos.y - aPos.y;
        const rr = aRadius + bRadius;
        return dx * dx + dy * dy <= rr * rr;
    }
}