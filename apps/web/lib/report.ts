import { getSeason, type Locale, type Season } from "@human-color/palette";

export interface AnalysisAxes {
  warmth: number;
  lightness: number;
  chroma: number;
  contrast: number;
}

export interface BaseTone {
  key: string;
  label: string;
  hex: string;
}

export interface GeneratedLook {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  prompt: string;
  imageUrl?: string;
}

export interface ReportPalette {
  bestColors: string[];
  neutrals: string[];
  accents: string[];
  avoidColors: string[];
  nearColors: string[];
}

export interface ReportData {
  id: string;
  locale: Locale;
  season: Season;
  confidence: number;
  axes: AnalysisAxes;
  baseTones: BaseTone[];
  palette: ReportPalette;
  uploadedImage?: string;
  looks: GeneratedLook[];
  createdAt: string;
}

export interface AnalysisOverride {
  season?: string;
  confidence?: number;
  axes?: AnalysisAxes;
  base_palette?: BaseTone[];
  recommended_palette?: ReportPalette;
}

const toneLabels: Record<string, string> = {
  cheek: "脸颊",
  midface: "中庭",
  neck: "颈部",
  lip: "唇色",
  hair: "发色",
  iris: "瞳色",
};

export function createDemoReport(uploadedImage?: string, locale: Locale = "zh-CN", analysis?: AnalysisOverride): ReportData {
  const season = getSeason(analysis?.season ?? "soft_autumn");
  const baseTones = analysis?.base_palette ?? (season.baseColors ?? []).map((tone) => ({
    key: tone.key,
    label: tone.label[locale] ?? toneLabels[tone.key] ?? tone.key,
    hex: tone.hex,
  }));
  const palette: ReportPalette = analysis?.recommended_palette ?? {
    bestColors: season.bestColors,
    neutrals: season.neutrals,
    accents: season.accents,
    avoidColors: season.avoidColors,
    nearColors: season.nearColors,
  };
  const heroColors = palette.bestColors.slice(0, 6).join(", ");

  return {
    id: "demo-soft-autumn",
    locale,
    season,
    confidence: analysis?.confidence ?? 0.82,
    axes: analysis?.axes ?? season.axes,
    baseTones,
    palette,
    uploadedImage,
    createdAt: new Date().toISOString(),
    looks: [
      {
        id: "business",
        title: "商务正装",
        subtitle: "驼色西装 + 暖白衬衫",
        color: palette.bestColors[10] ?? "#A67C52",
        prompt: `portrait of a man in a tailored suit using these extracted personal palette colors: ${heroColors}, premium editorial lighting`,
      },
      {
        id: "casual-knit",
        title: "休闲周末",
        subtitle: "橄榄针织 + 卡其长裤",
        color: palette.bestColors[11] ?? "#8B7355",
        prompt: `portrait of a man wearing relaxed knitwear and trousers using extracted palette colors: ${heroColors}, clean studio`,
      },
      {
        id: "commute",
        title: "通勤知性",
        subtitle: "暖灰 Polo + 深棕西裤",
        color: palette.neutrals[2] ?? "#9B8B7E",
        prompt: `portrait of a man in a polished commute outfit, quiet luxury styling, colors: ${heroColors}`,
      },
      {
        id: "layered",
        title: "社交场合",
        subtitle: "浅棕夹克 + 芥末衬衫",
        color: palette.accents[1] ?? "#D4915A",
        prompt: `portrait of a man in a layered social outfit, mature relaxed premium style, colors: ${heroColors}`,
      },
      {
        id: "tee",
        title: "度假轻松",
        subtitle: "砖橙 T 恤 + 米色裤",
        color: palette.accents[0] ?? "#C17A5B",
        prompt: `portrait of a man wearing a relaxed vacation outfit, natural daylight, colors: ${heroColors}`,
      },
      {
        id: "daily",
        title: "日常舒适",
        subtitle: "深咖毛衣 + 牛仔裤",
        color: palette.neutrals[5] ?? "#5C5340",
        prompt: `portrait of a man in comfortable smart casual clothing, extracted personal palette colors: ${heroColors}`,
      },
    ],
  };
}

export function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function readableTextColor(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? "#3B241A" : "#FFF7ED";
}
