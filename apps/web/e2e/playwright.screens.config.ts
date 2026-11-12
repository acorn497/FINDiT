import { defineConfig, devices } from '@playwright/test';

/** 화면 캡처 전용 (테스트 묶음과 따로) — scripts/capture-screens.sh 가 부른다 */
export default defineConfig({
  testDir: './screens',
  testMatch: '**/*.screens.ts',
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [['list']],
  outputDir: '../test-results-screens',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.BASE_URL ?? 'http://localhost:8080',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
});
