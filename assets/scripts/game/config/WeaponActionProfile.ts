export type WeaponActionType = 'melee' | 'ranged';

export interface WeaponActionProfile {
    type: WeaponActionType;

    recoilDistance: number;
    recoilDuration: number;
    recoverDuration?: number;

    dashDistance: number;
    dashDuration: number;
    hitRadius: number;
    /** Blade capsule endpoints along the weapon's local forward axis. */
    hitStart?: number;
    hitEnd?: number;

    bulletSpeed: number;
}
