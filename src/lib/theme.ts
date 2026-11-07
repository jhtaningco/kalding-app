export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "kalding-theme";

/**
 * Runs in <head> before first paint so the saved theme (or the OS preference
 * on a first visit) is applied with no light/dark flash.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})();`;
