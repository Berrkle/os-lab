import { FIREWALL_LOCALES, type FirewallLocale } from "../firewall/locale";

export function localeFromPath(pathname: string): FirewallLocale {
  const base = import.meta.env.PUBLIC_SITE_MODE === "pages" ? import.meta.env.BASE_URL.replace(/\/$/, "") : "";
  const first = (base && pathname.startsWith(`${base}/`) ? pathname.slice(base.length) : pathname).split("/")[1];
  return FIREWALL_LOCALES.includes(first as FirewallLocale) ? first as FirewallLocale : "en";
}

export function localePath(pathname: string, locale: FirewallLocale): string {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return pathname;
  const current = localeFromPath(pathname);
  const plain = current === "en" ? pathname : pathname.slice(current.length + 1) || "/";
  const result = locale === "en" ? plain : `/${locale}${plain}`;
  const base = import.meta.env.PUBLIC_SITE_MODE === "pages" ? import.meta.env.BASE_URL.replace(/\/$/, "") : "";
  return base && !result.startsWith(`${base}/`) ? `${base}${result}` : result;
}
