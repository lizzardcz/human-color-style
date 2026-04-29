import paletteData from "./seasons.json";

export type Locale = "en" | "zh-CN" | "es" | "pt" | "ja" | "ko" | "fr" | "de";

export type LocalizedText = Partial<Record<Locale, string>> & {
  en: string;
  "zh-CN": string;
};

export type ColorSwatch = string;

export interface BaseColor {
  key: string;
  label: LocalizedText;
  hex: string;
}

export interface SeasonAxes {
  warmth: number;
  lightness: number;
  chroma: number;
  contrast: number;
}

export interface SeasonAttributes {
  temperature: string;
  depth: string;
  chroma: string;
  contrast: string;
}

export interface Season {
  id: string;
  names: LocalizedText;
  description: LocalizedText;
  attributes: SeasonAttributes;
  axes: SeasonAxes;
  keywords: string[];
  baseColors?: BaseColor[];
  bestColors: ColorSwatch[];
  neutrals: ColorSwatch[];
  accents: ColorSwatch[];
  avoidColors: ColorSwatch[];
  nearColors: ColorSwatch[];
  styleKeywords: string[];
  menswear?: string[];
  makeup?: Record<string, string>;
  hairColors?: string[];
  accessoryColors?: string[];
}

export interface PaletteData {
  version: string;
  defaultSeasonId: string;
  seasons: Season[];
}

export const palette = paletteData as PaletteData;
export const seasons = palette.seasons;

export function getSeason(id = palette.defaultSeasonId): Season {
  return seasons.find((season) => season.id === id) ?? seasons[0];
}

export function getSeasonName(season: Season, locale: Locale = "en") {
  return season.names[locale] ?? season.names.en;
}

export function getSeasonDescription(season: Season, locale: Locale = "en") {
  return season.description[locale] ?? season.description.en;
}
