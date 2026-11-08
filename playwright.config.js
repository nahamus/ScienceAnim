// Smoke tests run against the production build (same base path and lazy chunks as GitHub Pages).
//   npm test                 every simulation, desktop + phone
//   npm test -- -g cpu       just one simulation
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const DESKTOP = { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } };
const PHONE = devices['Pixel 7'];
const CI = !!process.env.CI;
// Locally, WebGL sims get the real GPU. CI runners have none, so there they fall back to SwiftShader
// and the test renders them at reduced resolution instead (see tests/smoke.spec.js).
const GPU = CI ? {} : { launchOptions: { args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] } };

export default defineConfig({
  testDir: 'tests',
  timeout: 120_000,
  fullyParallel: true,
  workers: CI ? 2 : 4,
  retries: CI ? 1 : 0,
  reporter: CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}/ScienceAnim/`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', grepInvert: /@webgl/, use: { ...DESKTOP } },
    { name: 'phone', grepInvert: /@webgl/, use: { ...PHONE } },
    // WebGL sims crawl on the software renderer, so they get the real GPU where there is one.
    // (2D sims stay on the default: GPU mode throttles their frame loop in headless runs.)
    { name: 'desktop-gl', grep: /@webgl/, use: { ...DESKTOP, ...GPU } },
    { name: 'phone-gl', grep: /@webgl/, use: { ...PHONE, ...GPU } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort --open false`,
    url: `http://localhost:${PORT}/ScienceAnim/`,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
});
