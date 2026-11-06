export interface HurtFlash {
    duration: number;
    remaining: number;
    active: boolean;
    /** 命中当帧先显示完整闪白，下一帧再开始计时。 */
    justTriggered: boolean;
}
