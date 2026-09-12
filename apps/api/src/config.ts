/** 환경 변수 → 설정값. 기본값만으로도 로컬·compose 에서 바로 뜨도록 둔다. */
export const config = {
  get port() {
    return Number(process.env.PORT ?? 3000);
  },
  get databaseUrl() {
    return process.env.DATABASE_URL ?? 'postgres://findit:findit@localhost:5432/findit';
  },
};
