export const customCodeService = {
  getCodes() {
    const codes = localStorage.getItem('custom_codes');
    return codes ? JSON.parse(codes) : [];
  },

  saveCodes(codes) {
    localStorage.setItem('custom_codes', JSON.stringify(codes));
    this.injectAll(codes);
  },

  addCode(code) {
    const codes = this.getCodes();
    const newCode = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'enabled',
      history: [],
      ...code
    };
    codes.push(newCode);
    this.saveCodes(codes);
    return newCode;
  },

  updateCode(id, updates) {
    const codes = this.getCodes();
    const index = codes.findIndex(c => c.id === id);
    if (index !== -1) {
      // Save history
      const current = codes[index];
      const historyItem = {
        updatedAt: current.updatedAt,
        content: current.content,
        scope: current.scope,
        status: current.status
      };
      
      codes[index] = {
        ...current,
        ...updates,
        updatedAt: Date.now(),
        history: [historyItem, ...(current.history || [])].slice(0, 10) // Keep last 10
      };
      this.saveCodes(codes);
    }
  },

  deleteCode(id) {
    const codes = this.getCodes().filter(c => c.id !== id);
    this.saveCodes(codes);
  },

  injectAll(codes) {
    // Remove existing custom styles
    const existing = document.getElementById('custom-code-styles');
    if (existing) existing.remove();

    const enabledCodes = (codes || this.getCodes()).filter(c => c.status === 'enabled');
    if (enabledCodes.length === 0) return;

    let css = '';
    
    // Simplified injection: merge all global styles
    // Advanced scoping would require unique IDs or complex selectors
    enabledCodes.forEach(code => {
      // Simple logic: if it has device constraint, wrap in media query
      let block = code.content;
      
      if (code.device === 'desktop') {
        block = `@media (min-width: 1024px) { ${block} }`;
      } else if (code.device === 'mobile') {
        block = `@media (max-width: 1023px) { ${block} }`;
      }

      // If scoped to a specific theme (assuming we pass current theme, but here we inject all with selectors)
      if (code.themeSpecific && code.targetTheme) {
        block = `.theme-${code.targetTheme} { ${block} }`;
      }

      css += `\n/* ID: ${code.id} (${code.name}) */\n${block}\n`;
    });

    const style = document.createElement('style');
    style.id = 'custom-code-styles';
    style.textContent = css;
    document.head.appendChild(style);
  },

  // Initialize on app load
  init() {
    this.injectAll();
  }
};