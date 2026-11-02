export type WeaponAttackPhase = 'idle' | 'recoil' | 'strike' | 'shoot' | 'recover';

export interface WeaponAttackState {
    phase: WeaponAttackPhase;
    timer: number;

    targetEntity: number;
    aimRad: number;

    originX: number;
    originY: number;

    recoilFromX: number;
    recoilFromY: number;
    recoilToX: number;
    recoilToY: number;

    strikeFromX: number;
    strikeFromY: number;
    strikeToX: number;
    strikeToY: number;

    fired: boolean;
    hitApplied: boolean;
}