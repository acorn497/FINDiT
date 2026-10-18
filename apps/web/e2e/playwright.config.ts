import { defineConfig, devices } from '@playwright/test';

/**
 * E2E — 실제 컨테이너(web → api → db)를 대상으로 돈다.
 * BASE_URL 기본값은 compose 로 띄운 http://localhost:8080 (테스트 컨테이너 안에서는 http://web).
 */
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [['list']],
  outputDir: '../test-results',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:8080',
    trace: 'off',
    screenshot: 'off',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    {
      // 공통 시나리오 + *.mobile.spec.ts
      name: 'mobile',
      testIgnore: '**/*.desktop.spec.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
    },
    {
      // 공통 시나리오 + *.desktop.spec.ts
      name: 'desktop',
      testIgnore: '**/*.mobile.spec.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
});
