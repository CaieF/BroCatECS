/** Position at the start of this simulation frame, before any movement systems. */
export interface PreviousPosition {
    x: number;
    y: number;
    /** Portion of the frame travelled by a projectile before its lifetime expires. */
    travelFraction?: number;
}
