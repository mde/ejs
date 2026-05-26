let fs = require('fs');
let path = require('path');
let os = require('os');
let proc = require('child_process');

/* global namespace, task, desc */

function hasBinary(name) {
  let probe = process.platform === 'win32' ? 'where' : 'which';
  return proc.spawnSync(probe, [name], {stdio: 'ignore'}).status === 0;
}

let BUNDLER_SMOKE_ENTRY = [
  'import ejs from "ejs";',
  'const out = ejs.render("<%= name %>", { name: "<>&" });',
  'if (out !== "&lt;&gt;&amp;") throw new Error("unexpected: " + out);',
  'console.log("OK");',
  ''
].join('\n');

function runBundlerSmoke(opts) {
  return function () {
    let version = require('../package.json').version;
    let packagePath = path.resolve('pkg', 'ejs-v' + version + '.tar.gz');
    let fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(),
      'ejs-' + opts.name + '-test-'));
    let npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    if (!fs.existsSync(packagePath)) {
      throw new Error('Package tarball not found: ' + packagePath);
    }

    try {
      fs.writeFileSync(path.join(fixtureDir, 'package.json'), JSON.stringify({
        private: true,
        type: 'module'
      }, null, 2));

      proc.execFileSync(npmCmd,
        ['install', '--no-audit', '--no-fund'].concat(opts.packages, [packagePath]),
        {cwd: fixtureDir, stdio: 'inherit'});

      fs.writeFileSync(path.join(fixtureDir, 'smoke.js'),
        opts.smokeEntry || BUNDLER_SMOKE_ENTRY);

      for (let name in opts.files || {}) {
        fs.writeFileSync(path.join(fixtureDir, name), opts.files[name]);
      }

      let bin = path.join(fixtureDir, 'node_modules/.bin/', opts.bin);
      let result = proc.spawnSync(bin, opts.args,
        {cwd: fixtureDir, encoding: 'utf8'});

      if (result.status !== 0) {
        process.stderr.write(result.stderr || '');
        throw new Error(opts.name + ' exited with status ' + result.status);
      }

      let stderr = result.stderr || '';
      for (let pat of opts.warningPatterns || []) {
        if (pat.test(stderr)) {
          process.stderr.write(stderr);
          throw new Error(opts.name +
            ' emitted disallowed warning matching ' + pat);
        }
      }

      let bundleFile = opts.bundleFile || 'bundle.js';
      let bundleOut = proc.execFileSync(process.execPath, [bundleFile],
        {cwd: fixtureDir}).toString();
      if (!bundleOut.includes('OK')) {
        throw new Error(opts.name +
          ' bundle runtime output unexpected: ' + bundleOut);
      }
    }
    finally {
      fs.rmSync(fixtureDir, {recursive: true, force: true});
    }

    console.log(opts.name + ' smoke test completed.');
  };
}

namespace('test', function () {
  desc('Runs all ecosystem smoke tests against the release tarball');
  task('ecosystem', [
    'test:ecosystem:rollup',
    'test:ecosystem:rolldown',
    'test:ecosystem:tsdown',
    'test:ecosystem:esbuild',
    'test:ecosystem:webpack',
    'test:ecosystem:browserify',
    'test:ecosystem:vite',
    'test:ecosystem:bun',
    'test:ecosystem:deno'
  ], function () {});

  namespace('ecosystem', function () {
    desc('Runs the Rollup smoke test against the release tarball');
    task('rollup', ['publish:package'], runBundlerSmoke({
      name: 'rollup',
      packages: ['rollup', '@rollup/plugin-node-resolve'],
      files: {
        'rollup.config.js': [
          'import nodeResolve from "@rollup/plugin-node-resolve";',
          'export default {',
          '  input: "smoke.js",',
          '  output: { file: "bundle.js", format: "es" },',
          '  plugins: [nodeResolve()],',
          '  external: (id) => id.startsWith("node:")',
          '};',
          ''
        ].join('\n')
      },
      bin: 'rollup',
      args: ['-c'],
      warningPatterns: [
        /COMMONJS_VARIABLE_IN_ESM/,
        /UNRESOLVED_IMPORT/,
        /^\(!\) /m
      ]
    }));

    desc('Runs the Rolldown smoke test against the release tarball');
    task('rolldown', ['publish:package'], runBundlerSmoke({
      name: 'rolldown',
      packages: ['rolldown'],
      files: {
        'rolldown.config.js': [
          'export default {',
          '  input: "smoke.js",',
          '  output: { file: "bundle.js", format: "es" },',
          '  external: (id) => id.startsWith("node:")',
          '};',
          ''
        ].join('\n')
      },
      bin: 'rolldown',
      args: ['-c'],
      warningPatterns: [
        /COMMONJS_VARIABLE_IN_ESM/,
        /UNRESOLVED_IMPORT/,
        /^\(!\) /m
      ]
    }));

    desc('Runs the tsdown smoke test against the release tarball');
    task('tsdown', ['publish:package'], runBundlerSmoke({
      name: 'tsdown',
      packages: ['tsdown'],
      files: {
        'tsdown.config.js': [
          'export default {',
          '  entry: ["smoke.js"],',
          '  format: ["esm"],',
          '  external: [/^node:/],',
          '  clean: true',
          '};',
          ''
        ].join('\n')
      },
      bin: 'tsdown',
      args: [],
      bundleFile: 'dist/smoke.mjs',
      warningPatterns: [
        /COMMONJS_VARIABLE_IN_ESM/,
        /UNRESOLVED_IMPORT/,
        /^\(!\) /m
      ]
    }));

    desc('Runs the esbuild smoke test against the release tarball');
    task('esbuild', ['publish:package'], runBundlerSmoke({
      name: 'esbuild',
      packages: ['esbuild'],
      bin: 'esbuild',
      args: [
        'smoke.js',
        '--bundle',
        '--platform=node',
        '--format=esm',
        '--outfile=bundle.js'
      ],
      warningPatterns: [/▲ \[WARNING\]/]
    }));

    desc('Runs the Webpack smoke test against the release tarball');
    task('webpack', ['publish:package'], runBundlerSmoke({
      name: 'webpack',
      packages: ['webpack', 'webpack-cli'],
      files: {
        'webpack.config.cjs': [
          'module.exports = {',
          '  mode: "production",',
          '  entry: "./smoke.js",',
          '  output: { filename: "bundle.cjs", path: __dirname },',
          '  target: "node"',
          '};',
          ''
        ].join('\n')
      },
      bin: 'webpack',
      args: ['-c', 'webpack.config.cjs'],
      bundleFile: 'bundle.cjs',
      warningPatterns: [/WARNING in /]
    }));

    desc('Runs the Browserify smoke test against the release tarball');
    task('browserify', ['publish:package'], runBundlerSmoke({
      name: 'browserify',
      packages: ['browserify'],
      smokeEntry: [
        'var ejs = require("ejs");',
        'var out = ejs.render("<%= name %>", { name: "<>&" });',
        'if (out !== "&lt;&gt;&amp;") throw new Error("unexpected: " + out);',
        'console.log("OK");',
        ''
      ].join('\n'),
      bin: 'browserify',
      args: ['--node', 'smoke.js', '-o', 'bundle.cjs'],
      bundleFile: 'bundle.cjs',
      warningPatterns: []
    }));

    desc('Runs the Vite smoke test against the release tarball');
    task('vite', ['publish:package'], runBundlerSmoke({
      name: 'vite',
      packages: ['vite'],
      files: {
        'vite.config.js': [
          'export default {',
          '  build: {',
          '    lib: {',
          '      entry: "smoke.js",',
          '      formats: ["es"],',
          '      fileName: () => "bundle.js"',
          '    },',
          '    target: "node20",',
          '    rollupOptions: {',
          '      external: (id) => id.startsWith("node:")',
          '    },',
          '    minify: false',
          '  }',
          '};',
          ''
        ].join('\n')
      },
      bin: 'vite',
      args: ['build'],
      bundleFile: 'dist/bundle.js',
      warningPatterns: [/^warning/m, /\[plugin:/]
    }));

    desc('Runs the Bun smoke test against the release tarball');
    task('bun', ['publish:package'], function () {
      if (!hasBinary('bun')) {
        console.log('bun binary not found on PATH; skipping bun smoke test.');
        return;
      }
      let version = require('../package.json').version;
      let packagePath = path.resolve('pkg', 'ejs-v' + version + '.tar.gz');
      let fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ejs-bun-test-'));
      let npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

      if (!fs.existsSync(packagePath)) {
        throw new Error('Package tarball not found: ' + packagePath);
      }

      try {
        fs.writeFileSync(path.join(fixtureDir, 'package.json'), JSON.stringify({
          private: true,
          type: 'module'
        }, null, 2));

        proc.execFileSync(npmCmd, ['install', '--no-audit', '--no-fund', packagePath],
          {cwd: fixtureDir, stdio: 'inherit'});

        fs.writeFileSync(path.join(fixtureDir, 'smoke.ts'), [
          'import ejs from "ejs";',
          'const out = ejs.render("<%= name %>", { name: "<>&" });',
          'if (out !== "&lt;&gt;&amp;") throw new Error("unexpected: " + out);',
          'console.log("OK");',
          ''
        ].join('\n'));

        let result = proc.spawnSync('bun', ['run', 'smoke.ts'],
          {cwd: fixtureDir, encoding: 'utf8'});
        if (result.status !== 0) {
          process.stderr.write(result.stderr || '');
          throw new Error('bun exited with status ' + result.status);
        }
        if (/module is not defined/.test(result.stderr || '')) {
          process.stderr.write(result.stderr);
          throw new Error('bun reported "module is not defined" at runtime');
        }
        if (!(result.stdout || '').includes('OK')) {
          throw new Error('bun smoke output unexpected: ' + result.stdout);
        }
      }
      finally {
        fs.rmSync(fixtureDir, {recursive: true, force: true});
      }

      console.log('bun smoke test completed.');
    });

    desc('Runs the Deno smoke test against the release tarball');
    task('deno', ['publish:package'], function () {
      if (!hasBinary('deno')) {
        console.log('deno binary not found on PATH; skipping deno smoke test.');
        return;
      }
      let version = require('../package.json').version;
      let packagePath = path.resolve('pkg', 'ejs-v' + version + '.tar.gz');
      let fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ejs-deno-test-'));

      if (!fs.existsSync(packagePath)) {
        throw new Error('Package tarball not found: ' + packagePath);
      }

      try {
        let vendorEjsDir = path.join(fixtureDir, 'vendor', 'ejs');
        fs.mkdirSync(vendorEjsDir, {recursive: true});
        // Strip npm's `package/` top-level dir while extracting.
        proc.execFileSync('tar',
          ['-xzf', packagePath, '-C', vendorEjsDir, '--strip-components=1'],
          {stdio: 'inherit'});

        fs.writeFileSync(path.join(fixtureDir, 'smoke.ts'), [
          'import ejs from "./vendor/ejs/lib/esm/ejs.js";',
          'const out = ejs.render("<%= name %>", { name: "<>&" });',
          'if (out !== "&lt;&gt;&amp;") throw new Error("unexpected: " + out);',
          'console.log("OK");',
          ''
        ].join('\n'));

        let result = proc.spawnSync('deno', ['run', 'smoke.ts'],
          {cwd: fixtureDir, encoding: 'utf8'});
        if (result.status !== 0) {
          process.stderr.write(result.stderr || '');
          throw new Error('deno exited with status ' + result.status);
        }
        if (!(result.stdout || '').includes('OK')) {
          throw new Error('deno smoke output unexpected: ' + result.stdout);
        }
      }
      finally {
        fs.rmSync(fixtureDir, {recursive: true, force: true});
      }

      console.log('deno smoke test completed.');
    });
  });
});
