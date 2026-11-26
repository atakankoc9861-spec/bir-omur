// Ham dosyalardan GameData (testler ve denge betiği için; tarayıcıya girmez).
import countriesRaw from "../../data/processed/v1/countries.json";
import birthsRaw from "../../data/processed/v1/dogumlar.json";
import turRaw from "../../data/processed/v1/mvp/TUR.json";
import indRaw from "../../data/processed/v1/mvp/IND.json";
import ngaRaw from "../../data/processed/v1/mvp/NGA.json";
import chnRaw from "../../data/processed/v1/mvp/CHN.json";
import usaRaw from "../../data/processed/v1/mvp/USA.json";
import turProfile from "../../content/countries/TUR.json";
import sigpwned from "../../content/names/sigpwned-cc0.json";
import type { BirthsFileV1, CountriesFileV1, MvpCountryFileV1 } from "./data-v1";
import { buildGameData, type GameData } from "./gamedata";

export const RAW_MVP = [turRaw, indRaw, ngaRaw, chnRaw, usaRaw] as MvpCountryFileV1[];

export function loadGameData(): GameData {
  return buildGameData({
    countries: countriesRaw as CountriesFileV1,
    births: birthsRaw as BirthsFileV1,
    mvp: RAW_MVP,
    turProfile,
    sigpwned,
  });
}
