export type WeaponActionType = 'melee' | 'ranged';

export interface WeaponActionProfile {
    type: WeaponActionType;

    recoilDistance: number;
    recoilDuration: number;

    dashDistance: number;
    dashDuration: number;
    hitRadius: number;

    bulletSpeed: number;
}