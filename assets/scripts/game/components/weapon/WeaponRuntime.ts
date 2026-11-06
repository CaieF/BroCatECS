import { WeaponTier } from '../../weapon/WeaponTier';
import { WeaponActionType } from '../../config/WeaponActionProfile';

export interface WeaponRuntime {
    weaponKey: string;
    tier: WeaponTier;
    type: WeaponActionType;

    cooldown: number;

    recoilDistance: number;
    recoilDuration: number;
    recoverDuration: number;

    dashDistance: number;
    dashDuration: number;
    hitRadius: number;
    hitStart?: number;
    hitEnd?: number;

    bulletSpeed: number;
}
