const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const { createModuleLoader } = require('./helpers/load-typescript.cjs');
const { createCocosAssets } = require('./helpers/cocos-assets.cjs');

// Independent expected values from https://brotato.wiki.spellsandguns.com/Upgrades.
const expectedValues = {
    maxHp: [3, 6, 9, 12],
    hpRegen: [2, 3, 4, 5],
    lifeSteal: [1, 2, 3, 4],
    damagePct: [5, 8, 12, 16],
    meleeDamage: [2, 4, 6, 8],
    rangedDamage: [1, 2, 3, 4],
    elementalDamage: [1, 2, 3, 4],
    attackSpeedPct: [5, 10, 15, 20],
    critChance: [3, 5, 7, 9],
    engineering: [2, 3, 4, 5],
    range: [15, 30, 45, 60],
    armor: [1, 2, 3, 4],
    dodge: [3, 6, 9, 12],
    speedPct: [3, 6, 9, 12],
    luck: [5, 10, 15, 20],
    harvesting: [5, 8, 10, 12],
};
const percentStats = new Set(['lifeSteal', 'damagePct', 'attackSpeedPct', 'critChance', 'dodge', 'speedPct']);
const tests = [];
const test = (name, run) => tests.push({ name, run });

test('all 16 stats have the four Wiki values, unique IDs and matching applied bonuses', () => {
    const load = createModuleLoader();
    const { UpgradeOptionConfigTable: options } = load('assets/scripts/game/config/UpgradeOptionConfig.ts');
    const { StatApplyUtil } = load('assets/scripts/game/formula/StatApplyUtil.ts');
    assert.equal(options.length, 64);
    assert.equal(new Set(options.map(option => option.id)).size, 64);
    assert.deepEqual([...new Set(options.map(option => option.statKey))].sort(), Object.keys(expectedValues).sort());

    for (const [statKey, values] of Object.entries(expectedValues)) {
        for (let tier = 1; tier <= 4; tier++) {
            const matches = options.filter(option => option.statKey === statKey && option.tier === tier);
            assert.equal(matches.length, 1, `${statKey} tier ${tier}`);
            const option = matches[0];
            const value = values[tier - 1];
            assert.deepEqual(option.addStats, { [statKey]: value });
            assert.ok(option.desc.startsWith(`+${value}${percentStats.has(statKey) ? '%' : ' '}`), option.desc);

            const bonus = Object.fromEntries(Object.keys(expectedValues).map(key => [key, 0]));
            StatApplyUtil.applyPartialBonus(bonus, option.addStats);
            assert.equal(bonus[statKey], value);
            assert.equal(Object.values(bonus).reduce((sum, amount) => sum + amount, 0), value);
        }
    }
});

test('each offer contains distinct stats and requested counts stay within the stat pool', () => {
    const load = createModuleLoader();
    const { UpgradeOptionGenerator: generator } = load('assets/scripts/game/upgrade/UpgradeOptionGenerator.ts');
    let state = 72913;
    const random = () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
    };
    for (let level = 1; level <= 60; level++) {
        const offers = generator.rollOptions(4, { level, luck: 37, random });
        assert.equal(offers.length, 4);
        assert.equal(new Set(offers.map(option => option.statKey)).size, 4);
        assert.ok(offers.every(option => option.tier >= 1 && option.tier <= 4));
    }
    const all = generator.rollOptions(99, { level: 5, random: () => 0 });
    assert.equal(all.length, 16);
    assert.equal(new Set(all.map(option => option.statKey)).size, 16);
    assert.ok(all.every(option => option.tier === 2));
    assert.deepEqual(generator.rollOptions(0), []);
    assert.deepEqual(generator.rollOptions(-1), []);
});

test('Wiki guaranteed upgrade levels apply to every card regardless of luck', () => {
    const load = createModuleLoader();
    const { UpgradeOptionGenerator: generator } = load('assets/scripts/game/upgrade/UpgradeOptionGenerator.ts');
    const guaranteed = [[1, 1], [5, 2], [10, 3], [15, 3], [20, 3], [25, 4], [30, 4], [50, 4]];
    for (const [level, tier] of guaranteed) {
        for (const luck of [-200, 0, 1000]) {
            const offers = generator.rollOptions(4, { level, luck, random: () => 0.9999 });
            assert.ok(offers.every(option => option.tier === tier), `level ${level}, luck ${luck}`);
        }
    }
});

test('rarity thresholds follow level, luck and caps with a single roll', () => {
    const load = createModuleLoader();
    const { UpgradeOptionGenerator: generator } = load('assets/scripts/game/upgrade/UpgradeOptionGenerator.ts');
    const cases = [
        [2, 0, 0.059, 2], [2, 0, 0.06, 1],
        [4, 0, 0.019, 3], [4, 0, 0.02, 2], [4, 0, 0.18, 1],
        [8, 0, 0.002, 4], [8, 0, 0.0023, 3], [8, 0, 0.1, 2], [8, 0, 0.42, 1],
        [8, 100, 0.004, 4], [8, 100, 0.0046, 3], [8, 100, 0.2, 2], [8, 100, 0.6, 1],
        [8, -50, 0.001, 4], [8, -50, 0.049, 3], [8, -50, 0.2, 2], [8, -50, 0.21, 1],
        [24, 1000, 0.079, 4], [24, 1000, 0.08, 3], [24, 1000, 0.25, 2], [24, 1000, 0.6, 1],
        [8, -100, 0, 1], [8, -200, 0, 1],
    ];
    for (const [level, luck, value, expected] of cases) {
        let calls = 0;
        const actual = generator.rollTier(level, luck, () => { calls++; return value; });
        assert.equal(actual, expected, `level=${level}, luck=${luck}, random=${value}`);
        assert.equal(calls, 1);
    }
});

test('queued levels and rerolls use current bonuses, reject stale offers, and consume each reward once', () => {
    const load = createModuleLoader();
    const { World } = load('assets/scripts/core/ecs/World.ts');
    const types = load('assets/scripts/core/ecs/ComponentTypes.ts');
    const { CharacterStatsUtil } = load('assets/scripts/game/formula/CharacterStatsUtil.ts');
    const { UpgradeOptionConfigTable: options } = load('assets/scripts/game/config/UpgradeOptionConfig.ts');
    const { UpgradeOptionGenerator: generator } = load('assets/scripts/game/upgrade/UpgradeOptionGenerator.ts');
    const { LevelUpFlowSystem } = load('assets/scripts/game/systems/ui/LevelUpFlowSystem.ts');
    const world = new World();
    const player = world.createEntity();
    const base = { ...CharacterStatsUtil.createZero(), luck: 7, maxHp: 20 };
    const bonus = CharacterStatsUtil.createZero();
    const pending = { count: 2 };
    const economy = { gold: 1, material: 0 };
    world.addComponent(player, types.C_BASE_STATS, base);
    world.addComponent(player, types.C_BONUS_STATS, bonus);
    world.addComponent(player, types.C_FINAL_STATS, { ...base, luck: -99, moveSpeed: 100 });
    world.addComponent(player, types.C_LEVEL, { current: 6 });
    world.addComponent(player, types.C_PENDING_LEVEL_UP, pending);
    world.addComponent(player, types.C_ECONOMY, economy);

    const rolls = [];
    generator.rollOptions = (count, context) => {
        rolls.push({ count, ...context });
        return [
            options.find(option => option.statKey === 'luck' && option.tier === 2),
            options.find(option => option.statKey === 'maxHp' && option.tier === 2),
        ];
    };
    const panels = [];
    const previews = [];
    let hides = 0;
    const ctx = {
        playerEntity: player,
        waveJustEnded: true,
        levelUpPanelOpen: false,
        currentUpgradeOptions: [],
        battlePaused: false,
        waveEndUIHandled: false,
        uiFacade: {
            showLevelUpPanel(offers, stats, cost, select, refresh) { panels.push({ offers, stats, cost, select, refresh }); },
            updateLevelUpStats(stats) { previews.push(stats); },
            hideLevelUpPanel() { hides++; },
        },
    };
    new LevelUpFlowSystem().update(world, 0, ctx);
    assert.deepEqual(rolls[0], { count: 4, level: 5, luck: 7 });
    assert.equal(ctx.battlePaused, true);
    assert.equal(panels[0].stats.luck, '7');
    assert.equal(panels[0].offers[0].statKey, 'luck');
    assert.equal(panels[0].offers[0].tier, 2);
    assert.equal(panels[0].cost, 1);
    panels[0].select('armor_tier_4');
    assert.equal(pending.count, 2, 'unoffered IDs cannot grant stats');
    assert.equal(bonus.armor, 0);

    panels[0].refresh();
    assert.equal(economy.gold, 0);
    assert.equal(pending.count, 2);
    assert.deepEqual(rolls[1], { count: 4, level: 5, luck: 7 });
    panels[0].select('luck_tier_2');
    panels[0].refresh();
    assert.equal(bonus.luck, 0, 'an old callback cannot select even the same ID after reroll');
    assert.equal(panels.length, 2);
    panels[1].refresh();
    assert.equal(panels.length, 2, 'insufficient gold does not reroll');

    panels[1].select('luck_tier_2');
    assert.equal(pending.count, 1);
    assert.equal(bonus.luck, 10);
    assert.equal(previews[0].luck, '17');
    assert.deepEqual(rolls[2], { count: 4, level: 6, luck: 17 });
    panels[1].select('luck_tier_2');
    assert.equal(bonus.luck, 10, 'the previous level cannot be selected twice');
    panels[2].select('maxHp_tier_2');
    assert.equal(pending.count, 0);
    assert.equal(previews[1].maxHp, '26');
    assert.equal(hides, 1);
    assert.equal(ctx.levelUpPanelOpen, false);
    assert.equal(ctx.waveEndUIHandled, true);
    assert.deepEqual(ctx.currentUpgradeOptions, []);
    panels[2].select('maxHp_tier_2');
    assert.equal(bonus.maxHp, 6);
});

test('all configured icon and tier paths have Cocos SpriteFrame imports', () => {
    const load = createModuleLoader();
    const { StatIconPaths } = load('assets/scripts/ui/utils/StatIconPaths.ts');
    const { CardTierVisuals } = load('assets/scripts/ui/utils/CardTierVisuals.ts');
    assert.deepEqual(Object.keys(StatIconPaths).sort(), Object.keys(expectedValues).sort());
    const resourcePaths = [...Object.values(StatIconPaths)];
    for (let tier = 1; tier <= 4; tier++) {
        resourcePaths.push(CardTierVisuals[tier].backgroundPath, CardTierVisuals[tier].cardPath);
    }
    for (const resource of resourcePaths) {
        const imagePath = path.resolve(__dirname, '../assets/resources', `${resource}.png`);
        assert.ok(fs.existsSync(imagePath), resource);
        const meta = JSON.parse(fs.readFileSync(`${imagePath}.meta`, 'utf8'));
        assert.ok(Object.values(meta.subMetas).some(sub => sub.importer === 'sprite-frame' && sub.name === 'spriteFrame'), resource);
    }
});

test('OptionItem visual fields and all four scene instances resolve to the correct prefab components', () => {
    const readJson = file => JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'));
    const prefab = readJson('assets/resources/prefabs/ui/OptionItem.prefab');
    const prefabMeta = readJson('assets/resources/prefabs/ui/OptionItem.prefab.meta');
    const scene = readJson('assets/scenes/main.scene');
    const item = prefab.find(object => object.backgroundSprite && object.cardSprite && object.tierLabel);
    assert.ok(item, 'UpgradeOptionItem must expose all three visual bindings');
    const bindings = [
        ['backgroundSprite', 'cc.Sprite', 'Bg'],
        ['cardSprite', 'cc.Sprite', 'OptionItem'],
        ['tierLabel', 'cc.Label', 'LevelUpLabel'],
    ];
    for (const [property, type, nodeName] of bindings) {
        const component = prefab[item[property].__id__];
        assert.equal(component.__type__, type, property);
        const node = prefab[component.node.__id__];
        assert.equal(node._name, nodeName, property);
        assert.ok(node._components.some(ref => prefab[ref.__id__] === component), property);
    }
    assert.equal(prefab[item.cardSprite.__id__].node.__id__, item.node.__id__);
    const itemFileId = prefab[item.__prefab.__id__].fileId;
    const rootFileId = prefab[prefab[item.node.__id__]._prefab.__id__].fileId;
    const instances = scene.filter(object => object.__type__ === 'cc.PrefabInfo' && object.asset?.__uuid__ === prefabMeta.uuid);
    assert.equal(instances.length, 4);
    const panelIndex = scene.findIndex(object => Array.isArray(object.optionItems));
    assert.ok(panelIndex >= 0);
    assert.equal(scene[panelIndex].optionItems.length, 4);
    const overrides = scene.filter(object => object.__type__ === 'cc.TargetOverrideInfo'
        && object.source?.__id__ === panelIndex && object.propertyPath?.[0] === 'optionItems');
    assert.equal(overrides.length, 4);
    assert.deepEqual(overrides.map(object => object.propertyPath[1]).sort(), ['0', '1', '2', '3']);
    assert.equal(new Set(overrides.map(object => object.target.__id__)).size, 4);
    for (const override of overrides) {
        assert.deepEqual(scene[override.targetInfo.__id__].localID, [itemFileId]);
        const node = scene[override.target.__id__];
        assert.equal(node.__type__, 'cc.Node');
        const info = scene[node._prefab.__id__];
        assert.ok(instances.includes(info));
        assert.equal(info.root.__id__, override.target.__id__);
        assert.equal(info.fileId, rootFileId);
        assert.equal(scene[info.instance.__id__].__type__, 'cc.PrefabInstance');
        assert.ok(scene[node._parent.__id__]._children.some(ref => ref.__id__ === override.target.__id__));
    }
});

function assetFixture() {
    const assets = createCocosAssets();
    const load = createModuleLoader({ cc: assets.cc });
    const { SpriteFrameCache } = load('assets/scripts/core/resources/SpriteFrameCache.ts');
    const { SpriteFrameBinding } = load('assets/scripts/ui/common/SpriteFrameBinding.ts');
    return { ...assets, load, SpriteFrameCache, SpriteFrameBinding };
}

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

test('concurrent icon requests share a load, cache hit, and one retained asset', async () => {
    const { SpriteFrameCache: cache, requests, SpriteFrame } = assetFixture();
    cache.retain();
    cache.retain();
    const first = cache.load('textures/ui/icon/stat/icon_max_hp');
    const second = cache.load('textures/ui/icon/stat/icon_max_hp/spriteFrame');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].path, 'textures/ui/icon/stat/icon_max_hp/spriteFrame');
    assert.equal(requests[0].type, SpriteFrame);
    const frame = new SpriteFrame('hp');
    requests[0].callback(null, frame);
    assert.deepEqual(await Promise.all([first, second]), [frame, frame]);
    assert.equal(cache.get('textures/ui/icon/stat/icon_max_hp'), frame);
    assert.equal(await cache.load('textures/ui/icon/stat/icon_max_hp'), frame);
    assert.equal(requests.length, 1);
    assert.equal(frame.refCount, 1);
    cache.release();
    assert.equal(frame.refCount, 1, 'another binding still uses the shared cache');
    cache.release();
    assert.equal(frame.refCount, 0);
    assert.equal(cache.get('textures/ui/icon/stat/icon_max_hp'), null);
});

test('failed resource loads can retry and do not poison the cache', async () => {
    const { SpriteFrameCache: cache, requests, warnings, SpriteFrame } = assetFixture();
    cache.retain();
    const missing = cache.load('textures/missing');
    requests[0].callback(new Error('missing texture'), null);
    assert.equal(await missing, null);
    assert.equal(cache.get('textures/missing'), null);
    assert.equal(warnings.length, 1);
    const retry = cache.load('textures/missing');
    assert.equal(requests.length, 2);
    const frame = new SpriteFrame('recovered');
    requests[1].callback(null, frame);
    assert.equal(await retry, frame);
    cache.release();
    assert.equal(frame.refCount, 0);
});

test('refreshing a binding cannot be overwritten by an older async response', async () => {
    const { SpriteFrameBinding, requests, Sprite, SpriteFrame } = assetFixture();
    const sprite = new Sprite();
    const binding = new SpriteFrameBinding(sprite);
    binding.setPath('textures/old');
    binding.setPath('textures/new');
    const oldFrame = new SpriteFrame('old');
    const newFrame = new SpriteFrame('new');
    requests[1].callback(null, newFrame);
    await flushPromises();
    assert.equal(sprite.spriteFrame, newFrame);
    requests[0].callback(null, oldFrame);
    await flushPromises();
    assert.equal(sprite.spriteFrame, newFrame);
    binding.setPath('textures/new');
    assert.equal(sprite.spriteFrame, newFrame, 'cached updates are synchronous');
    assert.equal(requests.length, 2);
    binding.dispose();
    assert.equal(sprite.spriteFrame, null);
    assert.equal(oldFrame.refCount, 0);
    assert.equal(newFrame.refCount, 0);
    binding.dispose();
    assert.equal(newFrame.refCount, 0, 'dispose is idempotent');
});

test('destroying a binding during a load prevents writes and asset retention', async () => {
    const { SpriteFrameBinding, requests, Sprite, SpriteFrame } = assetFixture();
    const sprite = new Sprite();
    const binding = new SpriteFrameBinding(sprite);
    binding.setPath('textures/delayed');
    binding.dispose();
    const frame = new SpriteFrame('late');
    requests[0].callback(null, frame);
    await flushPromises();
    assert.equal(sprite.spriteFrame, null);
    assert.equal(frame.refCount, 0);
});

test('a same-stack replacement cannot reuse a completed promise for a released frame', async () => {
    const { SpriteFrameBinding, requests, Sprite, SpriteFrame } = assetFixture();
    const oldSprite = new Sprite();
    const oldBinding = new SpriteFrameBinding(oldSprite);
    oldBinding.setPath('textures/shared');
    const oldFrame = new SpriteFrame('old-owner');
    requests[0].callback(null, oldFrame);
    // Do not flush microtasks: this is the gap between resource completion and Promise handlers.
    oldBinding.dispose();
    assert.equal(oldFrame.refCount, 0);
    const newSprite = new Sprite();
    const newBinding = new SpriteFrameBinding(newSprite);
    newBinding.setPath('textures/shared');
    assert.equal(requests.length, 2, 'released completed loads are no longer pending');
    const newFrame = new SpriteFrame('new-owner');
    requests[1].callback(null, newFrame);
    await flushPromises();
    assert.equal(oldSprite.spriteFrame, null);
    assert.equal(newSprite.spriteFrame, newFrame);
    assert.equal(newFrame.refCount, 1);
    assert.equal(oldFrame.refCount, 0);
    newBinding.dispose();
    assert.equal(newFrame.refCount, 0);
});

test('a new view can take over an unfinished shared load without issuing another request', async () => {
    const { SpriteFrameBinding, requests, Sprite, SpriteFrame } = assetFixture();
    const oldSprite = new Sprite();
    const oldBinding = new SpriteFrameBinding(oldSprite);
    oldBinding.setPath('textures/shared');
    oldBinding.dispose();
    const newSprite = new Sprite();
    const newBinding = new SpriteFrameBinding(newSprite);
    newBinding.setPath('textures/shared');
    assert.equal(requests.length, 1);
    const frame = new SpriteFrame('shared');
    requests[0].callback(null, frame);
    await flushPromises();
    assert.equal(oldSprite.spriteFrame, null);
    assert.equal(newSprite.spriteFrame, frame);
    assert.equal(frame.refCount, 1);
    newBinding.dispose();
    assert.equal(frame.refCount, 0);
});

test('a node scheduled for destruction is not updated by a pending load', async () => {
    const { SpriteFrameBinding, requests, Sprite, SpriteFrame } = assetFixture();
    const sprite = new Sprite();
    const binding = new SpriteFrameBinding(sprite);
    binding.setPath('textures/delayed');
    sprite.node.destroying = true;
    const frame = new SpriteFrame('late');
    requests[0].callback(null, frame);
    await flushPromises();
    assert.equal(sprite.spriteFrame, null);
    binding.dispose();
    assert.equal(frame.refCount, 0);
});

test('oversized stat art fits inside its icon bounds without distorting aspect ratio', async () => {
    const { SpriteFrameBinding, requests, Sprite, SpriteFrame } = assetFixture();
    const sprite = new Sprite();
    const binding = new SpriteFrameBinding(sprite, { width: 64, height: 64 });
    binding.setPath('textures/wide-icon');
    const frame = new SpriteFrame('wide');
    frame.originalSize = { width: 256, height: 128 };
    requests[0].callback(null, frame);
    await flushPromises();
    assert.deepEqual(sprite.contentSize, { width: 64, height: 32 });
    assert.equal(sprite.sizeMode, Sprite.SizeMode.CUSTOM);
    binding.dispose();
    assert.equal(frame.refCount, 0);
});

async function main() {
    let failed = 0;
    for (const { name, run } of tests) {
        try {
            await run();
            process.stdout.write(`PASS ${name}\n`);
        } catch (error) {
            failed++;
            process.stderr.write(`FAIL ${name}\n${error.stack}\n`);
        }
    }
    process.stdout.write(`${tests.length - failed}/${tests.length} tests passed.\n`);
    process.exitCode = failed ? 1 : 0;
}

main().catch(error => {
    process.stderr.write(`${error.stack}\n`);
    process.exitCode = 1;
});
