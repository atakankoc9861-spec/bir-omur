// JSON dosyaları Vite/Vitest ile içe aktarılır. Tip denetimi büyük veri dosyalarının
// içeriğini çıkarmaya çalışmasın diye "unknown" olarak bildirilir; kullanan yer
// src/engine/data-v1.ts içindeki tiplerle daraltır.
declare module "*.json" {
  const value: unknown;
  export default value;
}
