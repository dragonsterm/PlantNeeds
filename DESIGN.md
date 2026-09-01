---
name: Botanical Ether
colors:
  surface: '#f9faf2'
  surface-dim: '#d9dbd3'
  surface-bright: '#f9faf2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4ed'
  surface-container: '#edefe7'
  surface-container-high: '#e7e9e1'
  surface-container-highest: '#e2e3dc'
  on-surface: '#191c18'
  on-surface-variant: '#42493e'
  inverse-surface: '#2e312c'
  inverse-on-surface: '#f0f1ea'
  outline: '#72796e'
  outline-variant: '#c2c9bb'
  surface-tint: '#3b6934'
  primary: '#154212'
  on-primary: '#ffffff'
  primary-container: '#2d5a27'
  on-primary-container: '#9dd090'
  inverse-primary: '#a1d494'
  secondary: '#4a6549'
  on-secondary: '#ffffff'
  secondary-container: '#ccebc7'
  on-secondary-container: '#506b4f'
  tertiary: '#60233e'
  on-tertiary: '#ffffff'
  tertiary-container: '#7c3a55'
  on-tertiary-container: '#ffaac8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bcf0ae'
  primary-fixed-dim: '#a1d494'
  on-primary-fixed: '#002201'
  on-primary-fixed-variant: '#23501e'
  secondary-fixed: '#ccebc7'
  secondary-fixed-dim: '#b0cfad'
  on-secondary-fixed: '#07200b'
  on-secondary-fixed-variant: '#334d33'
  tertiary-fixed: '#ffd9e4'
  tertiary-fixed-dim: '#ffb0cc'
  on-tertiary-fixed: '#3b0520'
  on-tertiary-fixed-variant: '#71314c'
  background: '#f9faf2'
  on-background: '#191c18'
  surface-variant: '#e2e3dc'
  forest-deep: '#1B3022'
  sage-soft: '#E1E8E0'
  earth-bark: '#4D4637'
  status-water: '#4A90E2'
  status-warning: '#D97706'
  glass-white: rgba(255, 255, 255, 0.6)
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  status-verdict:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 22px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 24px
  card-gap: 16px
  element-stack: 8px
  glass-padding: 20px
---

## Brand & Style

The design system is centered on a **Botanical Glassmorphism** aesthetic, bridging the gap between clinical data-driven plant care and the organic warmth of gardening. The personality is nurturing, sophisticated, and serene—aiming to evoke the feeling of a quiet morning in a greenhouse.

The interface prioritizes high-fidelity photography of lush greenery as a structural element rather than just decoration. By using semi-transparent frosted surfaces, the UI feels lightweight and integrated into the natural environment. This approach avoids "techy" tropes, opting instead for a professional, editorial feel that treats the user as a "Plant Parent" rather than a system administrator.

**Key Stylistic Pillars:**
- **Organic Glassmorphism:** Surfaces use high backdrop-blur values (20px-40px) with thin, light-colored strokes to simulate glass.
- **Natural Depth:** Depth is communicated through translucency and soft, environment-tinted shadows rather than heavy elevation.
- **Editorial Clarity:** Generous white space and crisp typography ensure that botanical data is legible against complex photographic backgrounds.

## Colors

The palette is derived from the natural forest floor and canopy. **Forest Deep** serves as the primary anchor for high-contrast text and primary actions, while **Sage Soft** and **Glass White** provide the foundation for the frosted UI layers.

**Functional Color Usage:**
- **Primary (#2D5A27):** Used for primary buttons, active states, and successful health indicators.
- **Secondary (#8BA888):** A calming sage used for secondary labels and progress bars.
- **Earth Bark (#4D4637):** Used for grounded text elements and "repotted" activity icons.
- **Status Colors:** These are slightly desaturated to maintain the botanical theme—blue for hydration, and a warm amber for "due soon" warnings.
- **Backgrounds:** The interface is designed to sit atop full-screen botanical photography. Surfaces use `rgba(255, 255, 255, 0.6)` with a `backdrop-filter: blur(30px)`.

## Typography

This design system utilizes **Plus Jakarta Sans** for headlines to provide a modern, slightly rounded warmth that feels welcoming. **Inter** is used for all functional data and body text, ensuring maximum legibility across dense care schedules and diagnosis panels.

Typography is often rendered in **Forest Deep** or **Earth Bark** to maintain high contrast against white glass layers. For mobile-specific headlines, the scale is tightened to prevent excessive wrapping on plant names. Status verdicts (like "WATER" or "SKIP") use a bold, slightly larger weight to act as clear anchors for the user's eye.

## Layout & Spacing

The layout follows a **Fluid Grid** model with high horizontal margins to create a "floating" effect for the central UI containers. 

**Breakpoints & Adapation:**
- **Mobile:** A single column layout with cards spanning the full width minus a 16px margin. Bottom navigation is persistent for easy thumb access to "Care" and "My Plants".
- **Tablet/Desktop:** A 12-column grid. The "Main Dashboard" utilizes a masonry-style grid for plant cards, allowing varying plant heights and nicknames to feel organic rather than rigid.
- **Rhythm:** An 8px base unit is used for all internal paddings. Glass panels always use a minimum of 20px padding to ensure content does not feel crowded against the blurred background edges.

## Elevation & Depth

Hierarchy is established through **Tonal Opacity** and **Backdrop Blur** rather than traditional Y-axis shadows.

- **Level 1 (Base):** Full-screen photography with a subtle dark or light overlay depending on the image brightness.
- **Level 2 (Cards):** Frosted glass surfaces (`opacity: 60%`) with a 1px solid white border at `10%` opacity. This "ghost border" defines the shape against complex backgrounds.
- **Level 3 (Active/Pop-up):** Higher opacity (`85%`) glass with a soft, diffused shadow (`0px 10px 30px rgba(0,0,0,0.05)`). This is used for "Log Watering" modals and "Diagnosis" panels to bring them forward in the user's focal plane.
- **Level 4 (Toasts):** Floating pill shapes with a green-tinted shadow to indicate agent activity confirmation.

## Shapes

The shape language is consistently **Rounded**, mimicking the soft curves of leaves and petals. 

- **Cards & Panels:** Use a 1rem (16px) corner radius to feel soft and approachable.
- **Buttons & Chips:** Use a pill-shaped (full-round) radius for "Log Watering" and "Watered" status badges, distinguishing them from the structural rectangular cards.
- **Countdown Rings:** Circular health indicators use a stroke width of 4px to maintain a delicate, high-fidelity appearance.

## Components

### Buttons & Inputs
- **Primary Action:** Solid **Forest Deep** background with white text. High corner radius (pill-shaped).
- **Secondary Action:** Glass-button with a 1px white border and backdrop blur.
- **Input Fields:** Semi-transparent glass troughs with a subtle inner shadow to indicate depth for text entry.

### Plant Cards
The core unit of the app. It must include:
- A high-quality plant image (top or side-aligned).
- A **Countdown Ring** visualizing the time until the next watering.
- Status badges ("Healthy", "Due Soon") positioned in the top-right of the card on a high-blur glass chip.

### Activity Timeline
A vertical list where each item is connected by a thin, sage-colored line. "Watered by agent" events should feature a subtle "Sparkle" or "Bot" icon to differentiate from manual human logging.

### Weather Widget
A horizontal, semi-transparent banner at the top of the dashboard. It uses minimal iconography and "Plus Jakarta Sans" for the temperature and "Rain Covered" verdicts.

### Diagnosis Panel
A multi-step selection tool using large, glass-tile "Symptom" selectors. When a symptom is selected, the tile border thickens and changes to **Primary Green**.