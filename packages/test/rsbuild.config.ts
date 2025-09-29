import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rsbuild/core';
import { pluginBasicSsl } from '@rsbuild/plugin-basic-ssl';

export default defineConfig({
  html: {
    template: './src/index.html',
  },
  plugins: [pluginBasicSsl(), pluginReact(), pluginSass()],
  tools: {
    rspack: (config) => {
      config.module!.rules!.push({
        test: /\.pcm$/,
        type: 'asset/resource',   // 输出到 dist，返回 URL
      });
    },
  },

  source: {
    entry: {
      index: './src/main.tsx',
    },
    tsconfigPath: './tsconfig.app.json',
  },
  server: {
    port: 4200
  },
  output: {
    copy: [{ from: './src/favicon.ico' }, { from: './src/assets' }],

    target: 'web',
    distPath: {
      root: 'dist',
    },
  },
});
