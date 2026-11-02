import { Vec2 } from 'cc';
import { BattleBounds } from '../battle/BattleBounds';

export class SpawnPositionUtil {
    public static getSpawnAroundPlayer(
        playerX: number,
        playerY: number,
        bounds: BattleBounds,
        minDistance: number = 420,
        maxDistance: number = 520
    ): Vec2 {
        const rad = Math.random() * Math.PI * 2;
        const dist = minDistance + Math.random() * (maxDistance - minDistance);

        let x = playerX + Math.cos(rad) * dist;
        let y = playerY + Math.sin(rad) * dist;

        if (x < bounds.minX) x = bounds.minX;
        if (x > bounds.maxX) x = bounds.maxX;
        if (y < bounds.minY) y = bounds.minY;
        if (y > bounds.maxY) y = bounds.maxY;

        return new Vec2(x, y);
    }
}