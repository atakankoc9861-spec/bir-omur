// Yaşayan sahne: dış arayüz. Ayrıntı: docs/stil-rehberi.md
export * from "./types";
export { SceneDirector, homeSeedFor, signatureOf } from "./director";
export { renderScene, renderStill, drawParticles, SCENE_W, SCENE_H, type RenderedScene } from "./render";
export { sceneStateFromLife, regionForCountry, kitIsExact, kitForCountry } from "./fromLife";
export { GORSEL_AYAR, type VisualProfileId } from "./gorsel-ayar";
export { guardians, canGoOutside } from "./cast";
export { thumbnail, visualDiff, MIN_VISUAL_DIFF } from "./director";
export type { RenderOptions, PlacedInfo } from "./render";
export { KITS } from "./kits";
export { Raster } from "./raster";
