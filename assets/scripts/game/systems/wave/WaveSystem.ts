import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import { WaveConfigTable } from '../../wave/WaveConfigTable';
import { SpawnPositionUtil } from '../../wave/SpawnPositionUtil';
import {
    C_DEAD_TAG,
    C_DESTROY_TAG,
    C_ENEMY_TAG,
    C_POSITION,
} from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { EnemyFactory } from '../../factory/EnemyFactory';
import { Query } from '../../../core/ecs/Query';

export class WaveSystem extends System {
    constructor() {
        super();
        this.priority = 15;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const waveConfig = WaveConfigTable.find(w => w.wave === ctx.currentWave);
        if (!waveConfig) return;
        if (!ctx.enemyLayer) return;
        if (!world.hasEntity(ctx.playerEntity)) return;
        if (!world.hasComponent(ctx.playerEntity, C_POSITION)) return;

        ctx.waveElapsed += dt;
        ctx.waveTimeRemaining = Math.max(0, waveConfig.duration - ctx.waveElapsed);

        const playerPos = world.requireComponent<Position>(ctx.playerEntity, C_POSITION);

        const aliveEnemyCount = Query.exclude(
            world,
            [C_ENEMY_TAG],
            [C_DEAD_TAG, C_DESTROY_TAG]
        ).length;

        for (const entry of waveConfig.entries) {
            const timerKey = `${ctx.currentWave}_${entry.enemyId}_${entry.interval}`;
            let timer = ctx.waveSpawnTimers.get(timerKey) ?? 0;
            timer -= dt;

            if (timer <= 0) {
                if (aliveEnemyCount < ctx.maxAliveEnemyCount) {
                    const canSpawnCount = Math.min(
                        entry.count,
                        ctx.maxAliveEnemyCount - aliveEnemyCount
                    );

                    for (let i = 0; i < canSpawnCount; i++) {
                        const spawnPos = SpawnPositionUtil.getSpawnAroundPlayer(
                            playerPos.x,
                            playerPos.y,
                            ctx.bounds
                        );

                        EnemyFactory.create(
                            ctx,
                            world,
                            ctx.enemyLayer,
                            entry.enemyId,
                            ctx.currentWave,
                            spawnPos.x,
                            spawnPos.y
                        );
                    }
                }

                timer = entry.interval;
            }

            ctx.waveSpawnTimers.set(timerKey, timer);
        }

        if (ctx.waveElapsed >= waveConfig.duration) {
            ctx.currentWave += 1;
            ctx.waveElapsed = 0;
            ctx.waveSpawnTimers.clear();
            ctx.waveJustEnded = true;

            console.log(`[Wave] enter wave ${ctx.currentWave}`);
        }
    }
}