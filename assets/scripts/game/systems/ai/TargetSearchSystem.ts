import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import { Query } from '../../../core/ecs/Query';
import {
    C_AUTO_AIM,
    C_DEAD_TAG,
    C_ENEMY_TAG,
    C_PLAYER_TAG,
    C_POSITION,
} from '../../../core/ecs/ComponentTypes';
import { AutoAim } from '../../components/weapon/AutoAim';
import { Position } from '../../components/common/Position';

export class TargetSearchSystem extends System {
    constructor() {
        super();
        this.priority = 40;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const players = Query.all(world, C_PLAYER_TAG, C_POSITION, C_AUTO_AIM);
        const enemies = Query.exclude(
            world,
            [C_ENEMY_TAG, C_POSITION],
            [C_DEAD_TAG]
        );

        for (const playerEntity of players) {
            const playerPos = world.requireComponent<Position>(playerEntity, C_POSITION);
            const autoAim = world.requireComponent<AutoAim>(playerEntity, C_AUTO_AIM);

            let bestTarget = 0;
            let bestDistSq = autoAim.range * autoAim.range;

            for (const enemyEntity of enemies) {
                const enemyPos = world.requireComponent<Position>(enemyEntity, C_POSITION);

                const dx = enemyPos.x - playerPos.x;
                const dy = enemyPos.y - playerPos.y;
                const distSq = dx * dx + dy * dy;

                if (distSq <= bestDistSq) {
                    bestDistSq = distSq;
                    bestTarget = enemyEntity;
                }
            }

            autoAim.targetEntity = bestTarget;
        }
    }
}