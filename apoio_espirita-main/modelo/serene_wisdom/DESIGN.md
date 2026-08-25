---
name: Serene Wisdom
colors:
  surface: "#f8f9fe"
  surface-dim: "#d8dadf"
  surface-bright: "#f8f9fe"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f2f3f8"
  surface-container: "#eceef3"
  surface-container-high: "#e7e8ed"
  surface-container-highest: "#e1e2e7"
  on-surface: "#191c1f"
  on-surface-variant: "#414751"
  inverse-surface: "#2e3134"
  inverse-on-surface: "#eff0f5"
  outline: "#717783"
  outline-variant: "#c1c7d3"
  surface-tint: "#0060ac"
  primary: "#005da7"
  on-primary: "#ffffff"
  primary-container: "#2976c7"
  on-primary-container: "#fdfcff"
  inverse-primary: "#a4c9ff"
  secondary: "#555f71"
  on-secondary: "#ffffff"
  secondary-container: "#d6e0f6"
  on-secondary-container: "#596376"
  tertiary: "#735c00"
  on-tertiary: "#ffffff"
  tertiary-container: "#cca72f"
  on-tertiary-container: "#4e3d00"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#d4e3ff"
  primary-fixed-dim: "#a4c9ff"
  on-primary-fixed: "#001c39"
  on-primary-fixed-variant: "#004883"
  secondary-fixed: "#d9e3f9"
  secondary-fixed-dim: "#bdc7dc"
  on-secondary-fixed: "#121c2c"
  on-secondary-fixed-variant: "#3d4759"
  tertiary-fixed: "#ffe088"
  tertiary-fixed-dim: "#e9c349"
  on-tertiary-fixed: "#241a00"
  on-tertiary-fixed-variant: "#574500"
  background: "#f8f9fe"
  on-background: "#191c1f"
  surface-variant: "#e1e2e7"
  spiritual-blue: "#4A90E2"
  deep-slate: "#2D3748"
  sacred-gold: "#D4AF37"
  warm-grey: "#718096"
  ethereal-white: "#F8F9FE"
  border-haze: "#E2E8F0"
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: "400"
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 36px
    fontWeight: "400"
    lineHeight: 44px
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: "400"
    lineHeight: 40px
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: "400"
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1120px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

The design system is crafted for a premium religious portal, prioritizing a sense of peace, sanctity, and intellectual clarity. The brand personality is serene, compassionate, and traditional yet contemporary. It aims to evoke an emotional response of tranquility and spiritual reassurance.

The design style follows a **Modern Minimalist** approach with **Glassmorphism** accents. It utilizes heavy whitespace to provide breathing room for reflection, high-quality imagery to connect with the human experience, and refined typographic hierarchies to convey the weight of spiritual wisdom. The interface should feel like a quiet sanctuary: light, airy, and unobtrusive.

## Colors

The palette is anchored in **Ethereal White** and **Spiritual Blue**, creating a backdrop that feels expansive and calm.

- **Primary (Spiritual Blue):** Used for key actions and spiritual highlights, representing the sky and infinite peace.
- **Secondary (Deep Slate):** Reserved for primary text and high-contrast elements to ensure grounded readability.
- **Tertiary (Sacred Gold):** Applied sparingly for premium accents, signaling wisdom, divinity, and precious insights.
- **Neutrals:** Soft greys and off-whites replace harsh blacks and pure whites to reduce eye strain and maintain a "warm" editorial feel.

## Typography

This design system uses a sophisticated typographic pairing to balance tradition with accessibility.

- **Headlines:** **Libre Caslon Text** provides a literary, authoritative, and timeless feel. Use it for article titles, section headers, and quotes to convey wisdom.
- **Body & UI:** **Inter** is used for all functional text and long-form reading. Its neutral, systematic nature ensures clarity and modern functionality.
- **Scalability:** Display sizes scale down for mobile to maintain a single-column harmony without overwhelming the viewport.
- **Editorial Touch:** Increase line height for body text (1.6x) to facilitate meditative, slow-paced reading.

## Layout & Spacing

The layout philosophy centers on a **Fixed Grid** for desktop to create a contained, "book-like" feel, and a fluid layout for mobile.

- **Grid:** A 12-column system is used for desktop.
- **Rhythm:** An 8px base unit governs all spacing.
- **Whitespace:** Emphasize vertical rhythm. Use generous padding between sections (80px - 120px) to allow the user's mind to rest between different content types.
- **Reflow:** On tablet and mobile, decrease margins and scale down gutters to 16px to maximize content area while retaining a "breathable" frame.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Ambient Shadows**.

- **Surfaces:** Use `#FFFFFF` for the primary content layer over the `#F8F9FE` background.
- **Shadows:** Shadows must be extremely subtle and "airy." Use a high blur radius (24px - 32px) with very low opacity (4-6%) tinted with the primary blue color (`#4A90E2`) to avoid a "dirty" grey look.
- **Glassmorphism:** Use for navigation bars and floating overlays. Apply a 12px backdrop blur with a 60% white opacity and a 1px solid border in `#E2E8F0` to simulate fine glassware.

## Shapes

The shape language is consistently **Rounded**, avoiding sharp edges to maintain a soft, approachable aesthetic.

- **Elements:** Standard buttons and input fields use a `0.5rem` radius.
- **Containers:** Large cards and content sections use `rounded-xl` (`1.5rem`) to create a soft frame for imagery and text.
- **Imagery:** Photos should feature slightly rounded corners or organic, circular masks to reinforce the theme of wholeness and community.

## Components

- **Buttons:** Primary buttons use a solid Spiritual Blue background with white text. Secondary buttons use a transparent background with a 1px `border-haze` and Deep Slate text. All buttons have a high horizontal padding (24px+) to feel "expensive."
- **Cards:** Use a white background, the "airy" ambient shadow, and a `1.5rem` corner radius. Content should be padded by at least 32px.
- **Input Fields:** Use a subtle `#F8F9FE` fill and a 1px `#E2E8F0` border. On focus, transition the border to Spiritual Blue with a soft outer glow.
- **Chips/Tags:** Use rounded-pill shapes with light blue tinted backgrounds (`#4A90E2` at 10% opacity) and Deep Slate text for categorizing spiritual topics.
- **Quotes/Scripture:** Create a specific "Wisdom Block" component using Libre Caslon Text, a Sacred Gold left-accent border, and increased italicization to highlight key spiritual passages.
- **Navigation:** A floating glassmorphic top-bar that stays fixed, providing a persistent sense of orientation and "lightness."
