import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import { Query } from '../../../core/ecs/Query';
import {
    C_DEAD_TAG,
    C_ENEMY_AI,
    C_ENEMY_STATE_MACHINE,
    C_ENEMY_STATS,
    C_ENEMY_TAG,
    C_POSITION,
    C_VELOCITY,
} from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { Velocity } from '../../components/common/Velocity';
import { EnemyStats } from '../../components/enemy/EnemyStats';
import { EnemyStateMachine } from '../../components/enemy/EnemyStateMachine';

export class EnemyChaseSystem extends System {
    constructor() {
        super();
        this.priority = 30;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const playerEntity = ctx.playerEntity;
        if (!playerEntity || !world.hasEntity(playerEntity)) return;

        const playerPos = world.getComponent<Position>(playerEntity, C_POSITION);
        if (!playerPos) return;

        const enemies = Query.exclude(
            world,
            [C_ENEMY_TAG, C_ENEMY_AI, C_ENEMY_STATS, C_ENEMY_STATE_MACHINE, C_POSITION, C_VELOCITY],
            [C_DEAD_TAG]
        );

        for (const entity of enemies) {
            const enemyPos = world.requireComponent<Position>(entity, C_POSITION);
            const enemyVel = world.requireComponent<Velocity>(entity, C_VELOCITY);
            const enemyStats = world.requireComponent<EnemyStats>(entity, C_ENEMY_STATS);
            const stateMachine = world.requireComponent<EnemyStateMachine>(entity, C_ENEMY_STATE_MACHINE);

            if (stateMachine.state !== 'chase') {
                continue;
            }

            let dirX = playerPos.x - enemyPos.x;
            let dirY = playerPos.y - enemyPos.y;

            const len = Math.sqrt(dirX * dirX + dirY * dirY);
            if (len > 0.0001) {
                dirX /= len;
                dirY /= len;
            } else {
                dirX = 0;
                dirY = 0;
            }

            enemyVel.x = dirX * enemyStats.moveSpeed;
            enemyVel.y = dirY * enemyStats.moveSpeed;

            enemyPos.x += enemyVel.x * dt;
            enemyPos.y += enemyVel.y * dt;
        }
    }
}