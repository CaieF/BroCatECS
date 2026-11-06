const assert = require('assert').strict;
const { createModuleLoader } = require('./helpers/load-typescript.cjs');
const { cc, Node, Vec3 } = require('./helpers/cocos-view.cjs');
const load = createModuleLoader({ cc });
const { World } = load('assets/scripts/core/ecs/World.ts');
const C = load('assets/scripts/core/ecs/ComponentTypes.ts');
const { E_DAMAGE } = load('assets/scripts/game/event/GameEventTypes.ts');
const { CharacterStatsUtil } = load('assets/scripts/game/formula/CharacterStatsUtil.ts');
const { WeaponDefinitionTable } = load('assets/scripts/game/config/WeaponDefinitionTable.ts');
const { CarryWeaponLayoutSystem } = load('assets/scripts/game/systems/weapon/CarryWeaponLayoutSystem.ts');
const { WeaponTargetSearchSystem } = load('assets/scripts/game/systems/weapon/WeaponTargetSearchSystem.ts');
const { WeaponAttackStartSystem } = load('assets/scripts/game/systems/weapon/WeaponAttackStartSystem.ts');
const { WeaponAttackUpdateSystem } = load('assets/scripts/game/systems/weapon/WeaponAttackUpdateSystem.ts');
const { WeaponView } = load('assets/scripts/game/view/WeaponView.ts');
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

function fixture(key = 'knife') {
    const world = new World();
    const owner = world.createEntity(), weapon = world.createEntity(), enemy = world.createEntity();
    const ownerPos = { x: 0, y: 0 }, pos = { x: 0, y: -20 }, enemyPos = { x: 90, y: -20 };
    world.addComponent(owner, C.C_POSITION, ownerPos);
    world.addComponent(owner, C.C_FINAL_STATS, { ...CharacterStatsUtil.createZero(), maxHp: 20 });
    world.addComponent(owner, C.C_LEVEL, { current: 1 });
    world.addComponent(owner, C.C_CARRY_WEAPON_SLOTS, { count: 1 });
    world.addComponent(enemy, C.C_ENEMY_TAG, true);
    world.addComponent(enemy, C.C_POSITION, enemyPos);
    world.addComponent(enemy, C.C_HEALTH, { current: 100, max: 100 });
    world.addComponent(enemy, C.C_COLLIDER, { radius: 10 });
    const state = { phase: 'idle', timer: 0, targetEntity: 0, aimRad: 0,
        originX: 0, originY: -20, anchorFromX: 0, anchorFromY: -20,
        recoilFromX: 0, recoilFromY: 0, recoilToX: 0, recoilToY: 0,
        strikeFromX: 0, strikeFromY: 0, strikeToX: 0, strikeToY: 0,
        recoverFromX: 0, recoverFromY: 0, damage: null, fired: false, hitEntities: new Set() };
    const runtime = { ...WeaponDefinitionTable[key].base.action, weaponKey: key, tier: 1, cooldown: 0 };
    for (const [type, value] of [
        [C.C_CARRY_WEAPON_TAG, true], [C.C_CARRY_OWNER, { entity: owner }],
        [C.C_CARRY_SLOT_INDEX, { value: 0 }], [C.C_POSITION, pos], [C.C_AIM_ROTATION, { rad: 0 }],
        [C.C_WEAPON_TARGET, { targetEntity: enemy, distanceSq: 8100 }],
        [C.C_WEAPON_ATTACK_STATE, state], [C.C_WEAPON_RUNTIME, runtime],
    ]) world.addComponent(weapon, type, value);
    const ctx = { effectLayer: new Node('Effects'), bulletLayer: new Node('Bullets'), nodePool: { get: () => new Node('Bullet') } };
    const layout = new CarryWeaponLayoutSystem(), search = new WeaponTargetSearchSystem();
    const start = new WeaponAttackStartSystem(), update = new WeaponAttackUpdateSystem();
    const tick = dt => { layout.update(world, dt, ctx); search.update(world, dt, ctx); start.update(world, dt, ctx); update.update(world, dt, ctx); };
    return { world, owner, weapon, enemy, state, runtime, ownerPos, pos, enemyPos, ctx, tick };
}
const tests = [
    ['an exactly overlapping target does not force the weapon angle to zero', () => {
        const f = fixture();
        f.enemyPos.x = f.pos.x; f.enemyPos.y = f.pos.y;
        f.world.requireComponent(f.weapon, C.C_AIM_ROTATION).rad = Math.PI / 2;
        f.tick(0.016);
        near(f.state.aimRad, Math.PI / 2);
    }],
    ['zero-health and pending-destruction targets cannot start another attack', () => {
        for (const status of ['zero-health', 'destroyed']) {
            const f = fixture();
            if (status === 'zero-health') f.world.requireComponent(f.enemy, C.C_HEALTH).current = 0;
            else f.world.addComponent(f.enemy, C.C_DESTROY_TAG, true);
            f.tick(0.016);
            assert.equal(f.state.phase, 'idle');
        }
    }],
    ['melee locks its angle even if the target crosses behind during the attack', () => {
        const f = fixture(); f.tick(0.04);
        const locked = f.state.aimRad;
        f.enemyPos.x = -100; f.enemyPos.y = 50;
        f.tick(0.04); f.tick(0.08);
        assert.equal(f.state.aimRad, locked);
        assert.equal(f.world.requireComponent(f.weapon, C.C_AIM_ROTATION).rad, locked);
        assert.ok(f.pos.x > 0);
    }],
    ['recoil follows a moving carry anchor and recovery returns smoothly to it', () => {
        const f = fixture(); f.tick(0.04);
        near(f.pos.x, -6);
        f.ownerPos.x = 20; f.ownerPos.y = 10;
        f.tick(0.04); near(f.pos.x, 8); near(f.pos.y, -10);
        f.tick(0.12); const extended = f.pos.x;
        f.tick(0.06); assert.ok(f.pos.x > 20 && f.pos.x < extended);
        f.tick(0.06); near(f.pos.x, 20); near(f.pos.y, -10);
        assert.equal(f.state.phase, 'idle');
    }],
    ['a large frame traverses all phases and hits the same targets as small frames', () => {
        const large = fixture(), small = fixture();
        large.tick(0.32);
        for (let i = 0; i < 32; i++) small.tick(0.01);
        assert.equal(large.state.phase, 'idle'); assert.equal(small.state.phase, 'idle');
        near(large.pos.x, small.pos.x); near(large.pos.y, small.pos.y);
        assert.deepEqual(large.world.eventBus.consume(E_DAMAGE), small.world.eventBus.consume(E_DAMAGE));
        assert.equal(large.state.hitEntities.size, 1);
    }],
    ['zero-duration phases terminate and still register only one melee hit', () => {
        const f = fixture();
        f.runtime.recoilDuration = f.runtime.dashDuration = f.runtime.recoverDuration = 0;
        f.tick(0.016);
        assert.equal(f.state.phase, 'idle');
        assert.equal(f.world.eventBus.consume(E_DAMAGE).length, 1);
    }],
    ['ranged shots spawn immediately at the current muzzle before recoil begins', () => {
        const f = fixture('pistol');
        const gun = new Node('Gun'); f.ctx.effectLayer.addChild(gun);
        const body = new Node('Body'); gun.addChild(body); body.setPosition(20, 0, 0); body.setScale(0.5, 0.5, 1);
        const muzzle = new Node('Muzzle'); body.addChild(muzzle); muzzle.setPosition(80, 24, 0);
        const view = gun.addComponent(WeaponView); view.body = body; view.muzzle = muzzle;
        gun.setPosition(999, 999, 0); gun.angle = 180;
        f.ctx.effectLayer.setPosition(100, 20, 0); f.ctx.effectLayer.setScale(2, 2, 1);
        f.ctx.bulletLayer.setPosition(-30, 5, 0); f.ctx.bulletLayer.setScale(0.5, 0.5, 1);
        f.world.addComponent(f.weapon, C.C_VIEW_REF, { node: gun });
        f.tick(0.01);
        const bullets = [...f.world.getEntities()].filter(entity => f.world.hasComponent(entity, C.C_PROJECTILE_TAG));
        assert.equal(bullets.length, 1);
        const bulletPos = f.world.requireComponent(bullets[0], C.C_POSITION);
        near(bulletPos.x, 500); near(bulletPos.y, -2);
        near(f.world.requireComponent(bullets[0], C.C_VELOCITY).x, 560);
        assert.equal(f.state.phase, 'recoil'); assert.ok(f.pos.x < 0);
        f.tick(0.15);
        assert.equal([...f.world.getEntities()].filter(entity => f.world.hasComponent(entity, C.C_PROJECTILE_TAG)).length, 1);
    }],
    ['weapon mirroring keeps authored scale and does not flicker near vertical aim', () => {
        const view = new WeaponView(); view.body = new Node('Body'); view.body.setScale(0.3, 0.6, 2);
        view.update_visual(89); view.update_visual(92); near(view.body.scale.y, 0.6);
        view.update_visual(100); near(view.body.scale.y, -0.6);
        view.update_visual(88); near(view.body.scale.y, -0.6);
        view.update_visual(80); near(view.body.scale.y, 0.6);
        view.update_visual(179); view.update_visual(-179); near(view.body.scale.y, -0.6);
        near(view.body.scale.x, 0.3); near(view.body.scale.z, 2);
    }],
    ['a view without optional body or muzzle nodes remains usable', () => {
        const view = new WeaponView(); view.node.setPosition(4, 5, 0);
        view.update_visual(180);
        const point = view.getMuzzleWorldPosition(new Vec3());
        near(point.x, 4); near(point.y, 5);
    }],
];
let failed = 0;
for (const [name, run] of tests) {
    try { run(); console.log(`PASS ${name}`); }
    catch (error) { failed++; console.error(`FAIL ${name}\n${error.stack}`); }
}
console.log(`${tests.length - failed}/${tests.length} weapon motion tests passed.`);
process.exitCode = failed ? 1 : 0;
