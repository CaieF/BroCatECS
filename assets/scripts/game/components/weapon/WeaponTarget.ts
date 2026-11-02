import { Entity } from '../../../core/ecs/Entity';

export interface WeaponTarget {
    targetEntity: Entity;
    distanceSq: number;
}