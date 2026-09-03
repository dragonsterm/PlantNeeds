/**
 * client/src/ui/components/footer.js
 * Universal application footer with matching frosted botanical glassmorphism
 * and responsive dark/light mode styles.
 */

export function getFooterHtml({ theme = 'light' } = {}) {
  const isDark = theme === 'dark';
  
  const glassStyle = isDark
    ? 'background: rgba(0, 0, 0, 0.32); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);'
    : 'background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.85); box-shadow: 0 8px 32px rgba(27, 48, 34, 0.08);';

  const textColor = isDark ? 'rgba(255, 255, 255, 0.65)' : '#556353';
  const brandColor = isDark ? '#FFFFFF' : '#1B3022';
  const iconColor = isDark ? '#A3D94E' : '#154212';
  const linkHover = isDark ? 'hover:text-white' : 'hover:text-[#1B3022]';

  return `
    <footer class="mt-16 pb-12">
      <div class="container mx-auto px-6 max-w-7xl">
        <div class="p-6 sm:p-7 rounded-[28px] flex flex-col sm:flex-row items-center justify-between gap-5 text-xs transition-colors duration-300" style="${glassStyle} color: ${textColor}; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-lg" style="color: ${iconColor};">potted_plant</span>
            <span class="font-bold tracking-tight text-sm" style="color: ${brandColor};">PlantNeeds</span>
            <span class="opacity-70 text-xs hidden md:inline">— Intelligent botanical care &amp; diagnosis</span>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-5 sm:gap-6 font-medium">
            <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" class="app-legal-link transition-colors cursor-pointer ${linkHover} underline-offset-4 hover:underline" style="text-decoration: none; color: inherit;">
              Privacy Policy
            </a>
            <span class="opacity-30">•</span>
            <a href="/terms-of-service.html" target="_blank" rel="noopener noreferrer" class="app-legal-link transition-colors cursor-pointer ${linkHover} underline-offset-4 hover:underline" style="text-decoration: none; color: inherit;">
              Terms of Service
            </a>
            <span class="opacity-30">•</span>
            <span class="inline-flex items-center gap-1.5 opacity-85 px-2.5 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-white/90' : 'bg-[#1B3022]/10 text-[#1B3022]'} font-semibold text-[11px]">
              <span class="w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#A3D94E]' : 'bg-[#154212]'}"></span>
              WebMCP Ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  `;
}
