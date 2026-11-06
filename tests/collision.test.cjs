const assert = require('assert').strict;
const { createModuleLoader } = require('./helpers/load-typescript.cjs');

const load = createModuleLoader({ cc: { randomRange: (min, max) => (min + max) / 2 } });
const { CollisionMath } = load('assets/scripts/core/math/CollisionMath.ts');
const { World } = load('assets/scripts/core/ecs/World.ts');
const C = load('assets/scripts/core/ecs/ComponentTypes.ts');
const { CampType } = load('assets/scripts/game/components/common/Camp.ts');
const { E_DAMAGE } = load('assets/scripts/game/event/GameEventTypes.ts');
const { CollisionSystem } = load('assets/scripts/game/systems/combat/CollisionSystem.ts');
const { ProjectileMoveSystem } = load('assets/scripts/game/systems/combat/ProjectileMoveSystem.ts');
const { PositionHistorySystem } = load('assets/scripts/game/systems/core/PositionHistorySystem.ts');
const { ProjectileFactory } = load('assets/scripts/game/factory/ProjectileFactory.ts');
const { EnemyFactory } = load('assets/scripts/game/factory/EnemyFactory.ts');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
const collide = (world, dt = 1) => new CollisionSystem().update(world, dt, {});

function actor(world, tag, x, y, radius = 5, hp = 20) {
    const entity = world.createEntity();
    world.addComponent(entity, tag, true);
    world.addComponent(entity, C.C_POSITION, { x, y });
    world.addComponent(entity, C.C_COLLIDER, { radius });
    world.addComponent(entity, C.C_HEALTH, { current: hp, max: hp });
    return entity;
}

function bullet(world, x, y, vx, vy, remaining = 2, camp = CampType.Player) {
    const entity = world.createEntity();
    world.addComponent(entity, C.C_PROJECTILE_TAG, true);
    world.addComponent(entity, C.C_POSITION, { x, y });
    world.addComponent(entity, C.C_VELOCITY, { x: vx, y: vy });
    world.addComponent(entity, C.C_COLLIDER, { radius: 1 });
    world.addComponent(entity, C.C_DAMAGE, { value: 7 });
    world.addComponent(entity, C.C_CAMP, { value: camp });
    world.addComponent(entity, C.C_LIFE_TIME, { remaining });
    return entity;
}

function history(world) {
    new PositionHistorySystem().update(world, 1, {});
}

function move(world, dt = 1) {
    new ProjectileMoveSystem().update(world, dt, {});
}

test('circle sweep handles crossing, tangency, initial overlap, zero movement and misses', () => {
    near(CollisionMath.segmentCircleFirstHit(-10, 0, 10, 0, 0, 0, 2), 0.4);
    near(CollisionMath.segmentCircleFirstHit(-10, 2, 10, 2, 0, 0, 2), 0.5);
    assert.equal(CollisionMath.segmentCircleFirstHit(0, 0, 0, 0, 0, 0, 2), 0);
    assert.equal(CollisionMath.segmentCircleFirstHit(4, 0, 4, 0, 0, 0, 2), null);
    assert.equal(CollisionMath.segmentCircleFirstHit(-10, 2.01, 10, 2.01, 0, 0, 2), null);
    assert.equal(CollisionMath.segmentCircleFirstHit(5, 0, 10, 0, 0, 0, 2), null);
    assert.equal(CollisionMath.segmentCircleFirstHit(-10, 0, -2, 0, 0, 0, 2), 1);
    assert.equal(CollisionMath.segmentCircleFirstHit(0, 0, 0, 0, 0, 0, -1), null);
});

test('relative circle sweep detects two objects exchanging positions', () => {
    near(CollisionMath.sweptCircleFirstHit(
        { x: -10, y: 0 }, { x: 10, y: 0 }, 1,
        { x: 10, y: 0 }, { x: -10, y: 0 }, 1
    ), 0.45);
    assert.equal(CollisionMath.sweptCircleFirstHit(
        { x: -10, y: 0 }, { x: 10, y: 0 }, 1,
        { x: -10, y: 3 }, { x: 10, y: 3 }, 1
    ), null);
});

test('capsule sweep handles its side, rounded ends, parallel motion and degenerate segment', () => {
    near(CollisionMath.segmentCapsuleFirstHit(5, 10, 5, -10, 0, 0, 10, 0, 2), 0.4);
    near(CollisionMath.segmentCapsuleFirstHit(-10, 0, 20, 0, 0, 0, 10, 0, 2), 8 / 30);
    near(CollisionMath.segmentCapsuleFirstHit(20, 0, -10, 0, 0, 0, 10, 0, 2), 8 / 30);
    assert.equal(CollisionMath.segmentCapsuleFirstHit(5, 1, 5, 1, 0, 0, 10, 0, 2), 0);
    assert.equal(CollisionMath.segmentCapsuleFirstHit(-10, 2.1, 20, 2.1, 0, 0, 10, 0, 2), null);
    near(CollisionMath.segmentCapsuleFirstHit(-10, 0, 10, 0, 0, 0, 0, 0, 2), 0.4);
    near(CollisionMath.segmentCapsuleFirstHit(10, 5, -10, 5, 0, 0, 0, 10, 2), 0.4);
});

test('high-speed projectiles hit the nearest target regardless of creation order', () => {
    const world = new World();
    actor(world, C.C_ENEMY_TAG, 80, 0);
    const nearEnemy = actor(world, C.C_ENEMY_TAG, 30, 0);
    const shot = bullet(world, 0, 0, 100, 0);
    history(world);
    move(world);
    collide(world);
    assert.deepEqual(world.eventBus.consume(E_DAMAGE), [{ sourceEntity: shot, targetEntity: nearEnemy, value: 7 }]);
    assert.equal(world.hasComponent(shot, C.C_DESTROY_TAG), true);
    near(world.requireComponent(shot, C.C_POSITION).x, 24);
    collide(world);
    assert.deepEqual(world.eventBus.consume(E_DAMAGE), []);
});

test('enemy crossing a stationary projectile is detected using position history', () => {
    const world = new World();
    const enemy = actor(world, C.C_ENEMY_TAG, 0, -20);
    const shot = bullet(world, 0, 0, 0, 0);
    history(world);
    world.requireComponent(enemy, C.C_POSITION).y = 20;
    move(world);
    collide(world);
    assert.equal(world.eventBus.consume(E_DAMAGE)[0].targetEntity, enemy);
    assert.equal(world.hasComponent(shot, C.C_DESTROY_TAG), true);
});

test('a visual near miss stays a miss through the full swept path', () => {
    const world = new World();
    actor(world, C.C_ENEMY_TAG, 50, 6.01);
    const shot = bullet(world, 0, 0, 100, 0);
    history(world);
    move(world);
    collide(world);
    assert.deepEqual(world.eventBus.consume(E_DAMAGE), []);
    assert.equal(world.hasComponent(shot, C.C_DESTROY_TAG), false);
});

test('dead, destroyed and zero-health enemies do not shield living targets', () => {
    const world = new World();
    const dead = actor(world, C.C_ENEMY_TAG, 10, 0);
    const destroyed = actor(world, C.C_ENEMY_TAG, 20, 0);
    actor(world, C.C_ENEMY_TAG, 30, 0, 5, 0);
    const live = actor(world, C.C_ENEMY_TAG, 60, 0);
    world.addComponent(dead, C.C_DEAD_TAG, true);
    world.addComponent(destroyed, C.C_DESTROY_TAG, true);
    bullet(world, 0, 0, 100, 0);
    history(world);
    move(world);
    collide(world);
    assert.equal(world.eventBus.consume(E_DAMAGE)[0].targetEntity, live);
});

test('each camp only damages the opposing actors', () => {
    for (const camp of [CampType.Player, CampType.Enemy]) {
        const world = new World();
        const friendlyTag = camp === CampType.Player ? C.C_PLAYER_TAG : C.C_ENEMY_TAG;
        const enemyTag = camp === CampType.Player ? C.C_ENEMY_TAG : C.C_PLAYER_TAG;
        actor(world, friendlyTag, 20, 0);
        const target = actor(world, enemyTag, 60, 0);
        bullet(world, 0, 0, 100, 0, 2, camp);
        history(world);
        move(world);
        collide(world);
        assert.equal(world.eventBus.consume(E_DAMAGE)[0].targetEntity, target);
    }
});

test('projectile lifetime ends exactly at its final segment and still registers an impact', () => {
    const world = new World();
    const target = actor(world, C.C_ENEMY_TAG, 24, 0);
    const shot = bullet(world, 0, 0, 100, 0, 0.2);
    history(world);
    move(world);
    assert.equal(world.requireComponent(shot, C.C_POSITION).x, 20);
    assert.equal(world.requireComponent(shot, C.C_LIFE_TIME).remaining, 0);
    assert.equal(world.hasComponent(shot, C.C_DESTROY_TAG), false);
    collide(world);
    assert.equal(world.eventBus.consume(E_DAMAGE)[0].targetEntity, target);
    assert.equal(world.hasComponent(shot, C.C_DESTROY_TAG), true);
});

test('projectile expiry cannot hit a target beyond its remaining range', () => {
    const world = new World();
    actor(world, C.C_ENEMY_TAG, 50, 0);
    const shot = bullet(world, 0, 0, 100, 0, 0.2);
    history(world);
    move(world);
    collide(world);
    assert.deepEqual(world.eventBus.consume(E_DAMAGE), []);
    assert.equal(world.hasComponent(shot, C.C_DESTROY_TAG), true);
});

test('the final lifetime segment uses only the matching fraction of target movement', () => {
    const world = new World();
    const target = actor(world, C.C_ENEMY_TAG, 0, 50);
    bullet(world, 0, 0, 0, 0, 0.2);
    history(world);
    world.requireComponent(target, C.C_POSITION).y = -50;
    move(world);
    collide(world);
    // Target reaches the bullet at t=0.5, after the bullet has expired at t=0.2.
    assert.deepEqual(world.eventBus.consume(E_DAMAGE), []);
});

test('history snapshots copy coordinates and reset each frame without aliasing Position', () => {
    const world = new World();
    const entity = actor(world, C.C_PLAYER_TAG, 10, 20);
    history(world);
    const previous = world.requireComponent(entity, C.C_PREVIOUS_POSITION);
    const position = world.requireComponent(entity, C.C_POSITION);
    position.x = 30;
    assert.equal(previous.x, 10);
    history(world);
    assert.equal(previous.x, 30);
    assert.notEqual(previous, position);
});

test('factories initialize new entities that are born after the frame snapshot', () => {
    const world = new World();
    const layer = { addChild: () => {} };
    const ctx = { nodePool: { get: () => ({ setPosition: () => {} }) } };
    history(world);
    const shot = ProjectileFactory.create(ctx, world, 'bulletPistol', layer, 100, 200, 1, 0, 100, 5, CampType.Player);
    const enemy = EnemyFactory.create(ctx, world, layer, 3001, 1, 130, 200);
    assert.deepEqual(world.requireComponent(shot, C.C_PREVIOUS_POSITION), { x: 100, y: 200, travelFraction: 1 });
    assert.deepEqual(world.requireComponent(enemy, C.C_PREVIOUS_POSITION), { x: 130, y: 200 });
    assert.equal(world.requireComponent(enemy, C.C_COLLIDER).radius, 28);
    move(world, 0.5);
    collide(world, 0.5);
    assert.equal(world.eventBus.consume(E_DAMAGE)[0].targetEntity, enemy);
});

test('dead or zero-health enemies cannot deal contact damage', () => {
    const world = new World();
    actor(world, C.C_PLAYER_TAG, 0, 0);
    const dead = actor(world, C.C_ENEMY_TAG, 0, 0);
    const noHealth = actor(world, C.C_ENEMY_TAG, 0, 0, 5, 0);
    world.addComponent(dead, C.C_DEAD_TAG, true);
    for (const entity of [dead, noHealth]) world.addComponent(entity, C.C_CONTACT_DAMAGE, { value: 5, interval: 0.5, cooldown: 0 });
    collide(world);
    assert.deepEqual(world.eventBus.consume(E_DAMAGE), []);
});

test('a charging enemy crossing the player damages once and respects its contact cooldown', () => {
    const world = new World();
    const player = actor(world, C.C_PLAYER_TAG, 0, 0);
    const enemy = actor(world, C.C_ENEMY_TAG, -50, 0);
    world.addComponent(enemy, C.C_CONTACT_DAMAGE, { value: 5, interval: 0.5, cooldown: 0 });
    history(world);
    world.requireComponent(enemy, C.C_POSITION).x = 50;
    collide(world, 0.1);
    assert.deepEqual(world.eventBus.consume(E_DAMAGE), [{ sourceEntity: enemy, targetEntity: player, value: 5 }]);
    history(world);
    world.requireComponent(enemy, C.C_POSITION).x = -50;
    collide(world, 0.1);
    assert.deepEqual(world.eventBus.consume(E_DAMAGE), []);
});

test('cooldown becoming ready later in the frame does not retroactively damage a past crossing', () => {
    const world = new World();
    actor(world, C.C_PLAYER_TAG, 0, 0);
    const enemy = actor(world, C.C_ENEMY_TAG, -50, 0);
    world.addComponent(enemy, C.C_CONTACT_DAMAGE, { value: 5, interval: 0.5, cooldown: 0.8 });
    history(world);
    world.requireComponent(enemy, C.C_POSITION).x = 50;
    collide(world, 1);
    assert.deepEqual(world.eventBus.consume(E_DAMAGE), []);
});

test('projectiles already marked for destruction are never advanced', () => {
    const world = new World();
    const shot = bullet(world, 0, 0, 100, 0);
    world.addComponent(shot, C.C_DESTROY_TAG, true);
    move(world);
    assert.deepEqual(world.requireComponent(shot, C.C_POSITION), { x: 0, y: 0 });
});

let failures = 0;
for (const { name, run } of tests) {
    try { run(); console.log(`PASS ${name}`); }
    catch (error) { failures++; console.error(`FAIL ${name}\n${error.stack}`); }
}
console.log(`\n${tests.length - failures}/${tests.length} collision checks passed.`);
if (failures) process.exitCode = 1;
