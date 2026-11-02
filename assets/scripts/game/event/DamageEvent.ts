import { Entity } from '../../core/ecs/Entity';

export interface DamageEvent {
    sourceEntity: Entity;
    targetEntity: Entity;
    value: number;
}