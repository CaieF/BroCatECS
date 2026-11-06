/** A point in battle-layer coordinates. */
export interface CollisionPoint {
    x: number;
    y: number;
}

/** Continuous 2D collision helpers. A hit is the first normalized time in [0, 1]. */
export class CollisionMath {
    public static segmentCircleFirstHit(
        sx: number, sy: number, ex: number, ey: number,
        cx: number, cy: number, radius: number
    ): number | null {
        if (radius < 0) return null;
        const dx = ex - sx;
        const dy = ey - sy;
        const ox = sx - cx;
        const oy = sy - cy;
        const c = ox * ox + oy * oy - radius * radius;
        if (c <= 0) return 0;

        const a = dx * dx + dy * dy;
        if (a <= 1e-12) return null;
        const b = ox * dx + oy * dy;
        // Outside the circle and travelling away from it.
        if (b >= 0) return null;
        const discriminant = b * b - a * c;
        if (discriminant < 0) return null;

        const t = (-b - Math.sqrt(discriminant)) / a;
        return t >= 0 && t <= 1 ? t : null;
    }

    public static sweptCircleFirstHit(
        aStart: CollisionPoint, aEnd: CollisionPoint, aRadius: number,
        bStart: CollisionPoint, bEnd: CollisionPoint, bRadius: number
    ): number | null {
        return this.segmentCircleFirstHit(
            aStart.x - bStart.x, aStart.y - bStart.y,
            aEnd.x - bEnd.x, aEnd.y - bEnd.y,
            0, 0, aRadius + bRadius
        );
    }

    /** A moving point against the capsule formed by segment AB and its radius. */
    public static segmentCapsuleFirstHit(
        sx: number, sy: number, ex: number, ey: number,
        ax: number, ay: number, bx: number, by: number, radius: number
    ): number | null {
        if (radius < 0) return null;
        const abx = bx - ax;
        const aby = by - ay;
        const length = Math.sqrt(abx * abx + aby * aby);
        if (length <= 1e-6) {
            return this.segmentCircleFirstHit(sx, sy, ex, ey, ax, ay, radius);
        }

        // The middle of a capsule is a rectangle in the segment's local basis.
        const ux = abx / length;
        const uy = aby / length;
        const startX = (sx - ax) * ux + (sy - ay) * uy;
        const startY = -(sx - ax) * uy + (sy - ay) * ux;
        const moveX = (ex - sx) * ux + (ey - sy) * uy;
        const moveY = -(ex - sx) * uy + (ey - sy) * ux;
        let enter = 0;
        let exit = 1;
        let hitsRectangle = true;
        const clip = (start: number, move: number, min: number, max: number): void => {
            if (Math.abs(move) <= 1e-12) {
                if (start < min || start > max) hitsRectangle = false;
                return;
            }
            const t1 = (min - start) / move;
            const t2 = (max - start) / move;
            enter = Math.max(enter, Math.min(t1, t2));
            exit = Math.min(exit, Math.max(t1, t2));
            if (enter > exit) hitsRectangle = false;
        };
        clip(startX, moveX, 0, length);
        clip(startY, moveY, -radius, radius);

        let firstHit: number | null = hitsRectangle ? enter : null;
        const startCap = this.segmentCircleFirstHit(sx, sy, ex, ey, ax, ay, radius);
        const endCap = this.segmentCircleFirstHit(sx, sy, ex, ey, bx, by, radius);
        if (startCap !== null && (firstHit === null || startCap < firstHit)) firstHit = startCap;
        if (endCap !== null && (firstHit === null || endCap < firstHit)) firstHit = endCap;
        return firstHit;
    }
}
