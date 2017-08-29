import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

let plugins = [
    resolve(),
    commonjs({
        include: 'node_modules/**'
    }),
    babel({
        babelrc: false,
        presets: [
           //'es2015-rollup'
        ],
        runtimeHelpers: true,
        plugins: [
            'transform-decorators-legacy',
            'transform-class-properties',
            'system-import-transformer'
        ]
    })
];

export default {
  entry: 'src/core.js',
  targets: [
    {
      format: 'umd',
      dest: 'dist/revelry.umd.js'
    },
    {
      format: 'es',
      dest: 'dist/revelry.js'
    }
  ],
  moduleName: 'RevelryCore',
  plugins: plugins,
  sourceMap: 'inline'
};