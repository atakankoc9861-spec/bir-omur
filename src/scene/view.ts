// Tarayıcı bağlayıcısı: 160x120 tamponu canvas'a basar, CSS ile tam sayı katında büyütür.
// Sabit kare bir kez çizilir; sadece yağmur/kar/toz varsa düşük kare hızında (12 fps) canlanır.
import { Raster } from "./raster";
import { type RenderOptions, type RenderedScene, SCENE_H, SCENE_W, drawParticles, renderScene } from "./render";
import type { SceneState, ScenePlan } from "./types";

export class SceneView {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly frameBuf = new Raster(SCENE_W, SCENE_H);
  private readonly img: ImageData;
  private scene: RenderedScene | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private frame = 0;
  /** Son tam çizim süresi (ms), performans izleme için. */
  lastRenderMs = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    canvas.width = SCENE_W;
    canvas.height = SCENE_H;
    canvas.style.imageRendering = "pixelated";
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("canvas 2d yok");
    this.ctx = ctx;
    this.img = ctx.createImageData(SCENE_W, SCENE_H);
    document.addEventListener("visibilitychange", () => (document.hidden ? this.stop() : this.start()));
  }

  show(state: SceneState, plan: ScenePlan, opts: RenderOptions = {}): void {
    const t0 = performance.now();
    this.showRendered(renderScene(state, plan, opts));
    this.lastRenderMs = performance.now() - t0;
  }

  /** Yönetmenin compose() ile hazırladığı sahneyi gösterir. */
  showRendered(scene: RenderedScene): void {
    this.scene = scene;
    this.frame = 0;
    this.paint();
    this.start();
  }

  private paint(): void {
    if (!this.scene) return;
    this.frameBuf.copyFrom(this.scene.base);
    drawParticles(this.frameBuf, this.scene, this.frame);
    this.img.data.set(this.frameBuf.data);
    this.ctx.putImageData(this.img, 0, 0);
  }

  private start(): void {
    this.stop();
    const w = this.scene?.plan.weather;
    if (!w || w === "clear" || w === "cloudy") return;
    this.timer = setInterval(() => { this.frame++; this.paint(); }, 1000 / 12);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
