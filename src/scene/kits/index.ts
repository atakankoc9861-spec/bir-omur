import type { RegionId } from "../types";
import type { RegionKit } from "./common";
import { akdeniz } from "./akdeniz";
import { batiAfrika } from "./bati-afrika";

export const KITS: Record<RegionId, RegionKit> = {
  akdeniz,
  "bati-afrika": batiAfrika,
};

export type { RegionKit } from "./common";
