const fs = require('fs');
const path = require('path');

let ts;
try {
    ts = require(process.env.COCOS_TYPESCRIPT || 'typescript');
} catch (error) {
    throw new Error('Set COCOS_TYPESCRIPT to the TypeScript package bundled with Cocos Creator before running these tests.');
}

/** Load real project modules without booting the Cocos renderer or changing require.extensions. */
function createModuleLoader(mocks = {}) {
    const cache = new Map();
    const root = path.resolve(__dirname, '../..');

    function load(file) {
        const filename = path.resolve(root, file);
        if (cache.has(filename)) return cache.get(filename).exports;

        const module = { exports: {} };
        cache.set(filename, module);
        const source = fs.readFileSync(filename, 'utf8');
        const output = ts.transpileModule(source, {
            fileName: filename,
            compilerOptions: {
                target: ts.ScriptTarget.ES2015,
                module: ts.ModuleKind.CommonJS,
                experimentalDecorators: true,
            },
        }).outputText;

        const localRequire = (specifier) => {
            if (Object.prototype.hasOwnProperty.call(mocks, specifier)) return mocks[specifier];
            if (!specifier.startsWith('.')) return require(specifier);
            const resolved = path.resolve(path.dirname(filename), specifier);
            return load(path.extname(resolved) ? resolved : `${resolved}.ts`);
        };

        new Function('require', 'module', 'exports', '__filename', '__dirname', output)(
            localRequire, module, module.exports, filename, path.dirname(filename)
        );
        return module.exports;
    }

    return load;
}

module.exports = { createModuleLoader };
