const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Run each suite in its own process so TypeScript loaders and Cocos stubs stay isolated.
const suites = fs.readdirSync(__dirname).filter(name => name.endsWith('.test.cjs')).sort();
let failed = 0;
for (const suite of suites) {
    console.log(`\n${suite}`);
    const result = spawnSync(process.execPath, [path.join(__dirname, suite)], { stdio: 'inherit' });
    if (result.error) console.error(result.error.message);
    if (result.status !== 0) failed++;
}
console.log(`\n${suites.length - failed}/${suites.length} suites passed.`);
process.exitCode = failed ? 1 : 0;
