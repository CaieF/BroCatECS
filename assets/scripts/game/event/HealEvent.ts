import { Entity } from '../../core/ecs/Entity';

export interface HealEvent {
    targetEntity: Entity;
    value: number;
    source?: 'regen' | 'lifesteal' | 'other';
}