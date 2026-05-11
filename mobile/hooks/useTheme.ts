import { useThemeStore } from "@/store/themeStore";
import { light, dark } from "@/theme/colors";

export function useTheme() {
  const isDark = useThemeStore((s) => s.isDark);
  return { c: isDark ? dark : light, isDark };
}
