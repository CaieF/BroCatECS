export interface LocalOffset {
    x: number;
    y: number;
}

export class CarryWeaponLayoutUtil {
    public static getOffsets(count: number): LocalOffset[] {
        switch (count) {
            case 1:
                return [
                    { x: 0, y: -20 },
                ];

            case 2:
                return [
                    { x: -40, y: -40 },
                    { x: 40, y: -40 },
                ];

            case 3:
                return [
                    { x: -40, y: -40 },
                    { x: 40, y: -40 },
                    { x: 0, y: 60 },
                ];

            case 4:
                return [
                    { x: -40, y: -40 },
                    { x: 40, y: -40 },
                    { x: -40, y: 60 },
                    { x: 40, y: 60 },
                ];

            case 5:
                return [
                    { x: -40, y: -40 },
                    { x: 40, y: -40 },
                    { x: -60, y: 10 },
                    { x: 60, y: 10 },
                    { x: 0, y: 60 },
                ];

            case 6:
            default:
                return [
                    { x: -40, y: -40 },
                    { x: 40, y: -40 },
                    { x: -60, y: 10 },
                    { x: 60, y: 10 },
                    { x: -40, y: 60 },
                    { x: 40, y: 60 },
                ];
        }
    }
}