const assert = require('assert').strict;
const { createModuleLoader } = require('./helpers/load-typescript.cjs');
const { cc, Node, Material, Sprite } = require('./helpers/cocos-view.cjs');
const load = createModuleLoader({ cc });
const { World } = load('assets/scripts/core/ecs/World.ts');
const C = load('assets/scripts/core/ecs/ComponentTypes.ts');
const { ActorView } = load('assets/scripts/game/view/ActorView.ts');
const { DamageApplySystem } = load('assets/scripts/game/systems/combat/DamageApplySystem.ts');
const { HurtFlashSystem } = load('assets/scripts/game/systems/view/HurtFlashSystem.ts');
const { ViewAnimationSyncSystem } = load('assets/scripts/game/systems/view/ViewAnimationSyncSystem.ts');
const { E_DAMAGE } = load('assets/scripts/game/event/GameEventTypes.ts');

function fixture() {
    const world = new World();
    const source = world.createEntity(), target = world.createEntity();
    const node = new Node('Enemy');
    const visual = new Node('Visual'); node.addChild(visual);
    const spriteNode = new Node('Sprite'); visual.addChild(spriteNode);
    const sprite = spriteNode.addComponent(Sprite);
    const actor = node.addComponent(ActorView); actor.visual = visual;
    const original = new Material(); sprite.customMaterial = original;
    const template = new Material();
    const flash = { duration: 0.12, remaining: 0, active: false, justTriggered: false };
    world.addComponent(target, C.C_HEALTH, { current: 100, max: 100 });
    world.addComponent(target, C.C_HURT_FLASH, flash);
    world.addComponent(target, C.C_POSITION, { x: 0, y: 0 });
    world.addComponent(target, C.C_VIEW_REF, { node });
    world.addComponent(target, C.C_FACING, { value: 1 });
    world.addComponent(target, C.C_ANIM_STATE, { current: 'idle' });
    const damage = new DamageApplySystem(), timer = new HurtFlashSystem(), sync = new ViewAnimationSyncSystem();
    const ctx = { flashWhiteMaterial: template };
    const tick = dt => { damage.update(world, dt, ctx); timer.update(world, dt, ctx); sync.update(world, dt, ctx); };
    const hit = (value = 1) => world.eventBus.emit(E_DAMAGE, { sourceEntity: source, targetEntity: target, value });
    return { world, target, actor, visual, sprite, original, template, flash, tick, hit };
}

const tests = [
    ['an unhurt actor keeps its original material and creates no flash instance', () => {
        const f = fixture(); f.tick(0.016);
        assert.equal(f.sprite.customMaterial, f.original);
        assert.equal(f.sprite.instancesCreated, 0);
    }],
    ['a long hit frame still renders full white before its duration is consumed', () => {
        const f = fixture(); f.hit(); f.tick(0.25);
        assert.equal(f.flash.active, true);
        assert.equal(f.flash.remaining, 0.12);
        assert.equal(f.sprite.instance.properties.glowsize, 1);
        assert.deepEqual(f.template.properties, {});
    }],
    ['a repeated hit restarts fading from full strength even while already active', () => {
        const f = fixture(); f.hit(); f.tick(0.016); f.tick(0.08);
        assert.ok(f.sprite.instance.properties.glowsize > 0 && f.sprite.instance.properties.glowsize < 1);
        f.hit(); f.tick(0.016);
        assert.equal(f.flash.remaining, 0.12);
        assert.equal(f.sprite.instance.properties.glowsize, 1);
        f.tick(0.2);
        assert.equal(f.flash.active, false);
        assert.equal(f.sprite.instance.properties.glowsize, 0);
    }],
    ['actors sharing one template have independent flash strengths', () => {
        const a = fixture(), b = fixture();
        a.actor.setFlashStrength(a.template, 1);
        b.actor.setFlashStrength(a.template, 0.25);
        assert.notEqual(a.sprite.instance, b.sprite.instance);
        assert.equal(a.sprite.instance.properties.glowsize, 1);
        assert.equal(b.sprite.instance.properties.glowsize, 0.25);
        assert.deepEqual(a.template.properties, {});
    }],
    ['pooling restores authored material and the reused view starts unflashed', () => {
        const f = fixture(); f.hit(); f.tick(0.016);
        const oldInstance = f.sprite.instance;
        f.actor.onDisable();
        assert.equal(f.sprite.customMaterial, f.original);
        assert.equal(oldInstance.isValid, false);
        f.actor.setFlashStrength(f.template, 0);
        assert.equal(f.sprite.customMaterial, f.original);
        f.actor.setFlashStrength(f.template, 1);
        assert.notEqual(f.sprite.instance, oldInstance);
        assert.equal(f.sprite.instance.properties.glowsize, 1);
        f.actor.onDestroy();
        assert.equal(f.sprite.customMaterial, f.original);
    }],
    ['animation material refreshes cannot silently remove an active flash', () => {
        const f = fixture(); f.hit(); f.tick(0.016);
        f.sprite.setSharedMaterial(null);
        f.actor.setFlashStrength(f.template, 0.7);
        assert.equal(f.sprite.customMaterial, f.template);
        assert.equal(f.sprite.instance.properties.glowsize, 0.7);
    }],
    ['automatic sprite discovery excludes decorative shadows', () => {
        const f = fixture();
        const shadowNode = new Node('Shadow'); f.visual.addChild(shadowNode);
        const shadow = shadowNode.addComponent(Sprite);
        f.hit(); f.tick(0.016);
        assert.equal(f.sprite.instance.properties.glowsize, 1);
        assert.equal(shadow.customMaterial, null);
        assert.equal(shadow.instancesCreated, 0);
    }],
    ['invalid damage and already dead targets do not trigger white flashes', () => {
        const f = fixture();
        for (const value of [0, -1, NaN, Infinity]) f.hit(value);
        f.tick(0.016);
        assert.equal(f.world.requireComponent(f.target, C.C_HEALTH).current, 100);
        assert.equal(f.flash.active, false);
        f.world.addComponent(f.target, C.C_DEAD_TAG, true);
        f.hit(10); f.tick(0.016);
        assert.equal(f.flash.active, false);
    }],
    ['a lethal hit flashes once and further queued damage does not restart it', () => {
        const f = fixture(); f.hit(100); f.hit(50); f.tick(0.016);
        assert.equal(f.world.requireComponent(f.target, C.C_HEALTH).current, 0);
        assert.equal(f.sprite.instance.properties.glowsize, 1);
        f.tick(0.08); const remaining = f.flash.remaining;
        f.hit(50); f.tick(0);
        assert.equal(f.flash.remaining, remaining);
    }],
];
let failed = 0;
for (const [name, run] of tests) {
    try { run(); console.log(`PASS ${name}`); }
    catch (error) { failed++; console.error(`FAIL ${name}\n${error.stack}`); }
}
console.log(`${tests.length - failed}/${tests.length} hurt flash tests passed.`);
process.exitCode = failed ? 1 : 0;
