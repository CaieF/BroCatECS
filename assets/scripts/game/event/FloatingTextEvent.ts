export type FloatingTextType = 'damage' | 'heal' | 'miss';

export interface FloatingTextEvent {
    x: number;
    y: number;
    text: string;
    type: FloatingTextType;
    critical?: boolean;
}