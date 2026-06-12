import React, { createContext, useContext, useState, useEffect } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, DEFAULT_THEME, THEME_KEY } from '../constants/themes';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ThemeContext = createContext({
  theme: THEMES.find(t => t.id === DEFAULT_THEME),
  colors: THEMES.find(t => t.id === DEFAULT_THEME).colors,
  themeId: DEFAULT_THEME,
  setTheme: () => {},
  themeList: THEMES,
});

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved) setThemeId(saved);
      setLoaded(true);
    };
    load();
  }, []);

  const setTheme = async (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setThemeId(id);
    await AsyncStorage.setItem(THEME_KEY, id);
  };

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, colors: theme.colors, themeId, setTheme, themeList: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
