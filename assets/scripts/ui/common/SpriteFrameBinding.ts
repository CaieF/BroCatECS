import { isValid, Sprite, SpriteFrame, UITransform } from 'cc';
import { SpriteFrameCache } from '../../core/resources/SpriteFrameCache';

/** 一个 Sprite 的异步资源绑定；组件销毁时必须调用 dispose。 */
export class SpriteFrameBinding {
    private _requestVersion: number = 0;
    private _disposed: boolean = false;

    public constructor(
        private readonly _sprite: Sprite,
        private readonly _fitBounds?: Readonly<{ width: number; height: number }>
    ) {
        SpriteFrameCache.retain();
    }

    public setPath(path: string): void {
        if (this._disposed || !this.isSpriteValid()) return;
        const version = ++this._requestVersion;
        const cached = SpriteFrameCache.get(path);
        this.applyFrame(cached);
        if (cached || !path) return;

        void SpriteFrameCache.load(path).then(frame => {
            if (this._disposed || version !== this._requestVersion || !this.isSpriteValid()) return;
            this.applyFrame(frame);
        });
    }

    public dispose(): void {
        if (this._disposed) return;
        this._disposed = true;
        this._requestVersion++;
        if (this.isSpriteValid()) this._sprite.spriteFrame = null;
        SpriteFrameCache.release();
    }

    private isSpriteValid(): boolean {
        return isValid(this._sprite, true) && isValid(this._sprite.node, true);
    }

    private applyFrame(frame: SpriteFrame | null): void {
        this._sprite.spriteFrame = frame;
        if (!frame || !this._fitBounds) return;

        const originalSize = frame.originalSize;
        if (originalSize.width <= 0 || originalSize.height <= 0) return;

        const scale = Math.min(
            this._fitBounds.width / originalSize.width,
            this._fitBounds.height / originalSize.height
        );
        this._sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this._sprite.getComponent(UITransform)?.setContentSize(
            originalSize.width * scale,
            originalSize.height * scale
        );
    }
}
