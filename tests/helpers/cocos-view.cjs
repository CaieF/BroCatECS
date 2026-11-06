// Minimal affine transforms and material ownership for testing real view/system code.
class Vec3 {
    constructor(x = 0, y = 0, z = 0) { this.set(x, y, z); }
    set(x, y, z = 0) {
        if (typeof x === 'object') { this.x = x.x; this.y = x.y; this.z = x.z || 0; }
        else { this.x = x; this.y = y; this.z = z; }
        return this;
    }
    static transformMat4(out, point, m) {
        const x = point.x, y = point.y;
        return out.set(m.a * x + m.c * y + m.tx, m.b * x + m.d * y + m.ty, point.z);
    }
}
class Node {
    constructor(name = '') {
        this.name = name; this.isValid = true; this.parent = null;
        this.position = new Vec3(); this.scale = new Vec3(1, 1, 1); this.angle = 0;
        this.children = []; this.components = [];
    }
    addChild(child) { child.parent = this; this.children.push(child); }
    setPosition(...args) { this.position.set(...args); }
    setScale(...args) { this.scale.set(...args); }
    addComponent(Type) { const comp = new Type(); comp.node = this; this.components.push(comp); return comp; }
    getComponent(Type) { return this.components.find(comp => comp instanceof Type) || null; }
    getComponentsInChildren(Type) {
        return this.components.filter(comp => comp instanceof Type).concat(...this.children.map(child => child.getComponentsInChildren(Type)));
    }
    get worldMatrix() {
        const radians = this.angle * Math.PI / 180;
        const cos = Math.cos(radians), sin = Math.sin(radians);
        const m = { a: cos * this.scale.x, b: sin * this.scale.x, c: -sin * this.scale.y, d: cos * this.scale.y, tx: this.position.x, ty: this.position.y };
        if (!this.parent) return m;
        const p = this.parent.worldMatrix;
        return { a:p.a*m.a+p.c*m.b, b:p.b*m.a+p.d*m.b, c:p.a*m.c+p.c*m.d, d:p.b*m.c+p.d*m.d,
            tx:p.a*m.tx+p.c*m.ty+p.tx, ty:p.b*m.tx+p.d*m.ty+p.ty };
    }
    getWorldPosition(out = new Vec3()) { return Vec3.transformMat4(out, new Vec3(), this.worldMatrix); }
    inverseTransformPoint(out, point) {
        const m = this.worldMatrix, det = m.a*m.d - m.b*m.c;
        const x = point.x - m.tx, y = point.y - m.ty;
        return out.set((m.d*x-m.c*y)/det, (-m.b*x+m.a*y)/det, point.z);
    }
}
class Component { constructor() { this.node = new Node(); this.isValid = true; this.enabledInHierarchy = true; } }
class Material {
    constructor(parent = null) { this.parent = parent; this.properties = {}; this.isValid = true; }
    setProperty(name, value) { this.properties[name] = value; }
}
class Sprite extends Component {
    constructor() { super(); this._custom = null; this._shared = null; this.instance = null; this.instancesCreated = 0; }
    get customMaterial() { return this._custom; }
    set customMaterial(value) { if (this._custom === value) return; this._custom = value; this.setSharedMaterial(value, 0); }
    setSharedMaterial(value) { if (this.instance) this.instance.isValid = false; this.instance = null; this._shared = value; }
    getSharedMaterial() { return this._shared; }
    getRenderMaterial() { return this.instance || this._shared; }
    getMaterialInstance() {
        if (!this._shared) return null;
        if (!this.instance) { this.instance = new Material(this._shared); this.instancesCreated++; }
        return this.instance;
    }
}
const property = (...args) => args.length >= 2 ? undefined : () => {};
const cc = { Vec3, Node, Component, Material, Sprite, Animation: class {}, Prefab: class {},
    _decorator: { ccclass: () => Type => Type, property }, random: () => 0.99,
    math: { toDegree: radians => radians * 180 / Math.PI },
};
module.exports = { cc, Vec3, Node, Material, Sprite };
