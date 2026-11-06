# Regression checks

The tests execute the real TypeScript modules with a small Cocos asset stub. They require Node.js 14+ and the TypeScript package already bundled with Cocos Creator; no npm installation is needed.

From the project root in PowerShell, adjust the Creator installation path if necessary:

```powershell
$env:COCOS_TYPESCRIPT = 'D:/cocos/editor/Creator/3.8.7/resources/app.asar.unpacked/node_modules/typescript'
node tests/run.cjs
node "$env:COCOS_TYPESCRIPT/lib/tsc.js" --project tsconfig.json --noEmit --skipLibCheck --pretty false
```

The upgrade suite covers the 64 Wiki values, applied bonuses, distinct offered stats, level guarantees, luck thresholds, queued level/reroll flow, stale callbacks, resource mappings, load deduplication, retry, cleanup and icon aspect ratio.

The combat suites cover continuous projectile and melee collisions, moving targets, contact cooldowns, attack direction and recovery, frame-rate changes, muzzle transforms, repeated damage, flash timing and material lifecycle. Each suite can also be run individually with `node tests/<name>.test.cjs`.

The stubs check logic without a renderer. Use the Cocos Creator 3.8.7 preview to verify rendered layout, shader compilation and the feel of the attacks. `--skipLibCheck` skips known errors in the Creator engine declarations; project TypeScript remains checked.
