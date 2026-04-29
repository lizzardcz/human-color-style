export const locales = ["en", "zh-CN", "es", "pt", "ja", "ko", "fr", "de"] as const;
export type AppLocale = (typeof locales)[number];

export function isLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

export async function loadMessages(locale: AppLocale) {
  switch (locale) {
    case "zh-CN":
      return (await import("@/messages/zh-CN.json")).default;
    case "es":
      return (await import("@/messages/es.json")).default;
    case "pt":
      return (await import("@/messages/pt.json")).default;
    case "ja":
      return (await import("@/messages/ja.json")).default;
    case "ko":
      return (await import("@/messages/ko.json")).default;
    case "fr":
      return (await import("@/messages/fr.json")).default;
    case "de":
      return (await import("@/messages/de.json")).default;
    default:
      return (await import("@/messages/en.json")).default;
  }
}
