/**
 * client/src/ui/components/footer.js
 * Universal application footer with Privacy Policy and Terms of Service modal / links.
 */

export function getFooterHtml({ theme = 'light' } = {}) {
  const isDark = theme === 'dark';
  const textColor = isDark ? 'rgba(255, 255, 255, 0.55)' : '#556353';
  const linkHover = isDark ? 'hover:text-white' : 'hover:text-[#1B3022]';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(27, 48, 34, 0.08)';

  return `
    <footer class="mt-16 pt-8 pb-12 border-t text-center text-xs" style="border-color: ${borderColor}; color: ${textColor}; font-family: 'Plus Jakarta Sans', sans-serif;">
      <div class="container mx-auto px-6 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-sm text-[#154212]" style="font-size: 16px;">potted_plant</span>
          <span class="font-bold ${isDark ? 'text-white' : 'text-[#1B3022]'}">PlantNeeds</span>
          <span>— Intelligent botanical care &amp; diagnosis</span>
        </div>
        <div class="flex items-center gap-6">
          <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" class="app-legal-link transition-colors cursor-pointer ${linkHover}" style="text-decoration: none; color: inherit;">Privacy Policy</a>
          <span class="opacity-30">•</span>
          <a href="/terms-of-service.html" target="_blank" rel="noopener noreferrer" class="app-legal-link transition-colors cursor-pointer ${linkHover}" style="text-decoration: none; color: inherit;">Terms of Service</a>
          <span class="opacity-30">•</span>
          <span class="opacity-75">WebMCP Ready</span>
        </div>
      </div>
    </footer>
  `;
}
