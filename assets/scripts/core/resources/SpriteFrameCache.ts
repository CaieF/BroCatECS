import { isValid, resources, SpriteFrame, warn } from 'cc';

/**
 * 按需加载的共享 UI 图片缓存。使用方 retain/release 配对；最后一个使用方
 * 销毁时释放缓存引用，隐藏面板不释放，避免每次升级都重新加载相同图片。
 */
export class SpriteFrameCache {
    private static _users: number = 0;
    private static readonly _frames = new Map<string, SpriteFrame>();
    private static readonly _pending = new Map<string, Promise<SpriteFrame | null>>();

    public static retain(): void {
        this._users++;
    }

    public static release(): void {
        if (this._users === 0) return;
        this._users--;
        if (this._users > 0) return;

        for (const frame of this._frames.values()) {
            if (isValid(frame)) frame.decRef();
        }
        this._frames.clear();
        // 在途请求保留以便新使用方复用；完成时会再次检查是否还有使用方。
    }

    public static get(path: string): SpriteFrame | null {
        const key = this.normalizePath(path);
        const frame = this._frames.get(key);
        if (frame && isValid(frame)) return frame;
        this._frames.delete(key);
        return null;
    }

    /** 路径相对 resources，不含扩展名；可省略 /spriteFrame 后缀。 */
    public static load(path: string): Promise<SpriteFrame | null> {
        const key = this.normalizePath(path);
        if (!key || this._users === 0) return Promise.resolve(null);

        const cached = this.get(key);
        if (cached) return Promise.resolve(cached);

        const pending = this._pending.get(key);
        if (pending) return pending;

        let resolveRequest: (frame: SpriteFrame | null) => void;
        const request = new Promise<SpriteFrame | null>(resolve => {
            resolveRequest = resolve;
        });
        this._pending.set(key, request);

        const finish = (frame: SpriteFrame | null): void => {
            // 同步移除已完成请求，防止最后一个视图释放缓存后，新视图仍取得旧 Promise。
            if (this._pending.get(key) === request) this._pending.delete(key);
            resolveRequest(frame);
        };

        try {
            resources.load(key, SpriteFrame, (error, frame) => {
                if (error || !frame || !isValid(frame)) {
                    warn(`[SpriteFrameCache] 加载失败: ${key}`, error);
                    finish(null);
                    return;
                }

                frame.addRef();
                if (this._users > 0) {
                    this._frames.set(key, frame);
                    finish(frame);
                } else {
                    // 加载期间所有视图均已销毁，不让迟到的资源常驻。
                    frame.decRef();
                    finish(null);
                }
            });
        } catch (error) {
            warn(`[SpriteFrameCache] 加载失败: ${key}`, error);
            finish(null);
        }
        return request;
    }

    private static normalizePath(path: string): string {
        const normalized = path.trim().replace(/\\/g, '/').replace(/\/+$/, '');
        if (!normalized) return '';
        return normalized.endsWith('/spriteFrame') ? normalized : `${normalized}/spriteFrame`;
    }
}
