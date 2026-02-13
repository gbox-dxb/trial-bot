import { themes } from './themes';

export const themeEngine = {
  applyTheme(themeKey) {
    // Validate theme key, fallback to 'dark' (Dark Matter)
    const validTheme = themes[themeKey] ? themeKey : 'dark';
    const theme = themes[validTheme];
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('theme-dark', 'theme-midnight');
    
    // Add new theme class
    root.classList.add(`theme-${validTheme}`);
    
    // Set CSS variables
    Object.entries(theme.colors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Save to localStorage
    localStorage.setItem('selected_theme', validTheme);
  },

  getInitialTheme() {
    const saved = localStorage.getItem('selected_theme');
    
    // Migration Logic: Map old themes to new ones
    if (saved) {
      if (saved === 'midnight' || saved === 'ocean' || saved === 'sunset') {
        // Map Ocean and Sunset to Midnight, keep Midnight as Midnight
        return 'midnight';
      }
      if (['light', 'emerald', 'highContrast', 'dark'].includes(saved)) {
         // Map Light, Emerald, High Contrast to Dark Matter
         return 'dark'; 
      }
      
      // Fallback for valid keys or unknowns
      return themes[saved] ? saved : 'dark';
    }

    // Default to Dark Matter if nothing stored
    return 'dark';
  }
};