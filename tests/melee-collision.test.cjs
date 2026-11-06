const assert = require('assert').strict;
const { createModuleLoader } = require('./helpers/load-typescript.cjs');
const load = createModuleLoader();
const { World } = load('assets/scripts/core/ecs/World.ts');
const C = load('assets/scripts/core/ecs/ComponentTypes.ts');
const { MeleeHitResolver } = load('assets/scripts/game/weapon/MeleeHitResolver.ts');
const { E_DAMAGE } = load('assets/scripts/game/event/GameEventTypes.ts');

function fixture(angle = 0) {
    const world = new World();
    const weapon = world.createEntity();
    const state = { aimRad: angle, hitEntities: new Set() };
    const runtime = { hitStart: 0, hitEnd: 48, hitRadius: 14 };
    const enemy = (x, y, previous = { x, y }) => {
        const entity = world.createEntity();
        world.addComponent(entity, C.C_ENEMY_TAG, true);
        world.addComponent(entity, C.C_POSITION, { x, y });
        world.addComponent(entity, C.C_PREVIOUS_POSITION, previous);
        world.addComponent(entity, C.C_COLLIDER, { radius: 10 });
        world.addComponent(entity, C.C_HEALTH, { current: 100, max: 100 });
        return entity;
    };
    const sweep = (from, to, start = 0, end = 1) => {
        MeleeHitResolver.applySweep(world, weapon, state, runtime, from, to, 9, start, end);
        return world.eventBus.consume(E_DAMAGE);
    };
    return { world, weapon, state, runtime, enemy, sweep };
}

const tests = [
    ['a fast thrust hits along the blade path without the former wide circular damage area', () => {
        const f = fixture();
        const target = f.enemy(80, 0);
        f.enemy(80, 70);
        f.enemy(-40, 0);
        const events = f.sweep({ x: 0, y: 0 }, { x: 100, y: 0 });
        assert.deepEqual(events, [{ sourceEntity: f.weapon, targetEntity: target, value: 9 }]);
    }],
    ['a target already touching the blade is hit even with no translation', () => {
        const f = fixture();
        const target = f.enemy(50, 10);
        assert.equal(f.sweep({ x: 0, y: 0 }, { x: 0, y: 0 })[0].targetEntity, target);
    }],
    ['an enemy crossing the blade between frames is hit', () => {
        const f = fixture();
        const target = f.enemy(30, 100, { x: 30, y: -100 });
        assert.equal(f.sweep({ x: 0, y: 0 }, { x: 0, y: 0 })[0].targetEntity, target);
    }],
    ['movement during windup is not treated as movement during the strike substep', () => {
        const f = fixture();
        f.enemy(30, 100, { x: 30, y: -100 });
        assert.equal(f.sweep({ x: 0, y: 0 }, { x: 0, y: 0 }, 0.75, 1).length, 0);
    }],
    ['rotated blade geometry follows the locked attack direction', () => {
        const f = fixture(Math.PI / 2);
        const target = f.enemy(0, 80);
        f.enemy(80, 0);
        const events = f.sweep({ x: 0, y: 0 }, { x: 0, y: 60 });
        assert.deepEqual(events.map(event => event.targetEntity), [target]);
    }],
    ['one swing cannot damage the same enemy twice and dead enemies are ignored', () => {
        const f = fixture();
        const live = f.enemy(40, 0);
        const dead = f.enemy(41, 0);
        const destroyed = f.enemy(42, 0);
        const zeroHp = f.enemy(43, 0);
        f.world.addComponent(dead, C.C_DEAD_TAG, true);
        f.world.addComponent(destroyed, C.C_DESTROY_TAG, true);
        f.world.requireComponent(zeroHp, C.C_HEALTH).current = 0;
        assert.deepEqual(f.sweep({ x: 0, y: 0 }, { x: 20, y: 0 }).map(event => event.targetEntity), [live]);
        assert.equal(f.sweep({ x: 20, y: 0 }, { x: 40, y: 0 }).length, 0);
        f.state.hitEntities.clear();
        assert.equal(f.sweep({ x: 0, y: 0 }, { x: 20, y: 0 }).length, 1);
    }],
    ['one large step and many small steps hit the same static targets once', () => {
        function simulate(steps) {
            const f = fixture();
            for (const x of [0, 40, 80, 130, 190]) f.enemy(x, 0);
            const hits = [];
            for (let i = 0; i < steps; i++) {
                hits.push(...f.sweep({ x: 100 * i / steps, y: 0 }, { x: 100 * (i + 1) / steps, y: 0 }, i / steps, (i + 1) / steps));
            }
            return hits.map(event => event.targetEntity).sort();
        }
        assert.deepEqual(simulate(1), simulate(20));
    }],
];

let failed = 0;
for (const [name, run] of tests) {
    try { run(); console.log(`PASS ${name}`); }
    catch (error) { failed++; console.error(`FAIL ${name}\n${error.stack}`); }
}
console.log(`${tests.length - failed}/${tests.length} melee collision tests passed.`);
process.exitCode = failed ? 1 : 0;
