export type WeaponAttackPhase = 'idle' | 'recoil' | 'strike' | 'shoot' | 'recover';

export interface WeaponAttackState {
    phase: WeaponAttackPhase;
    timer: number;

    targetEntity: number;
    aimRad: number;

    originX: number;
    originY: number;
    /** Carry anchor at the start of this frame, before the owner moved. */
    anchorFromX: number;
    anchorFromY: number;

    /** Animation endpoints are offsets from the moving carry anchor. */
    recoilFromX: number;
    recoilFromY: number;
    recoilToX: number;
    recoilToY: number;

    strikeFromX: number;
    strikeFromY: number;
    strikeToX: number;
    strikeToY: number;

    recoverFromX: number;
    recoverFromY: number;

    fired: boolean;
    damage: number | null;
    hitEntities: Set<number>;
}
