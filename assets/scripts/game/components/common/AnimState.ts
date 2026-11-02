export type AnimStateName = 'idle' | 'move' | 'death';

export interface AnimState {
    current: AnimStateName;
    locked: boolean;
}