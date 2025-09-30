import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/esm/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    {
      file: 'dist/cjs/index.cjs',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/umd/index.min.js',
      format: 'umd',
      name: 'SteamAudioPlayer',
      sourcemap: true
    }
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
};