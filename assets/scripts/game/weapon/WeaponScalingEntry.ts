import { WeaponScalingStat } from './WeaponScalingStat';

export interface WeaponScalingEntry {
    stat: WeaponScalingStat;
    ratio: number; // 例如 80% 就写 0.8
}