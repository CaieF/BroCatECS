/** Controllable async resource loader; assertions still run against the real cache/binding modules. */
function createCocosAssets() {
    const requests = [];
    const warnings = [];

    class SpriteFrame {
        constructor(name) {
            this.name = name;
            this.isValid = true;
            this.refCount = 0;
            this.originalSize = { width: 64, height: 64 };
        }
        addRef() { this.refCount++; return this; }
        decRef() { this.refCount--; return this; }
    }

    class Sprite {
        constructor() {
            this.isValid = true;
            this.node = { isValid: true };
            this.spriteFrame = null;
            this.transform = {
                setContentSize: (width, height) => { this.contentSize = { width, height }; },
            };
        }
        getComponent() { return this.transform; }
    }
    Sprite.SizeMode = { CUSTOM: 0 };

    const cc = {
        SpriteFrame,
        Sprite,
        UITransform: class UITransform {},
        isValid: (object) => !!object && object.isValid !== false && !object.destroying,
        warn: (...message) => warnings.push(message),
        resources: {
            load(path, type, callback) { requests.push({ path, type, callback }); },
        },
    };

    return { cc, requests, warnings, Sprite, SpriteFrame };
}

module.exports = { createCocosAssets };
