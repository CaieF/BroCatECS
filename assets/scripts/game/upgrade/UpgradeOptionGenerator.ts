import { UpgradeOptionConfig, UpgradeOptionConfigTable } from '../config/UpgradeOptionConfig';

export class UpgradeOptionGenerator {
    public static rollOptions(count: number): UpgradeOptionConfig[] {
        const pool = [...UpgradeOptionConfigTable];
        const result: UpgradeOptionConfig[] = [];

        for (let i = 0; i < count && pool.length > 0; i++) {
            const index = Math.floor(Math.random() * pool.length);
            result.push(pool[index]);
            pool.splice(index, 1);
        }

        return result;
    }
}