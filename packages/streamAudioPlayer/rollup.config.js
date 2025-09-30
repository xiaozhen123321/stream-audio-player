import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  // ESM + CJS 构建
  {
    input: 'src/index.ts', // ESM/CJS 入口
    output: [
      { file: 'dist/esm/index.esm.js', format: 'esm', sourcemap: true },
      { file: 'dist/cjs/index.cjs.js', format: 'cjs', sourcemap: true },
    ],
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ 
        tsconfig: './tsconfig.lib.json',
        declaration: false,  // Rollup 不处理声明文件
        emitDeclarationOnly: false,
        outDir: undefined        // 不设置 outDir
      })
    ]
  },

  // UMD 构建
  {
    input: 'src/umd.ts', // UMD 单独入口
    output: {
      file: 'dist/umd/index.min.js',
      format: 'umd',
      name: 'StreamAudioPlayer', // 全局变量名
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ 
        tsconfig: './tsconfig.lib.json',
        declaration: false,  // Rollup 不处理声明文件
        emitDeclarationOnly: false,
        outDir: undefined        // 不设置 outDir
      })
    ]
  }
];
