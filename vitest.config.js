import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = import.meta.dirname;

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const rootDir = import.meta.dirname;
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
      '@/shared': path.resolve(rootDir, './src/shared'),
      '@/microfrontends': path.resolve(rootDir, './src/microfrontends'),
      '@/layouts': path.resolve(rootDir, './src/layouts'),
      '@/views': path.resolve(rootDir, './src/views'),
      '@/mocks': path.resolve(rootDir, './src/mocks')
    }
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: ['src/mocks/**/*.mock.js', 'src/services/**', 'src/shared/utils/**', 'src/shared/components/ErrorState.vue', 'src/shared/components/Modal.vue', 'src/shared/components/Select.vue'],
      thresholds: {
        statements: 55,
        branches: 45,
        functions: 60,
        lines: 60
      }
    },
    projects: [{
      extends: true,
      test: {
        name: 'unit',
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/setup.js'],
        include: ['tests/**/*.test.js']
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});