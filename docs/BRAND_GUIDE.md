# HostelMate Brand Guide

## Brand Identity

### Mission Statement
**"Live Better, Together"** — HostelMate transforms shared living through intelligent task distribution, creating harmonious communities where everyone contributes fairly.

### Brand Personality
- **Trustworthy** — Users rely on us for fair, unbiased task allocation
- **Modern** — Clean, intuitive design that feels premium
- **Empowering** — Gamification makes mundane tasks rewarding
- **Community-focused** — Built for shared living experiences

---

## Logo System

### Primary Logo
The HostelMate logo combines a stylized house/home mark with the wordmark. The house symbol represents:
- **Home & Community** — The foundation of shared living
- **Unity** — Geometric structure showing collaboration
- **Growth** — Upward-pointing form suggesting progress
- **Excellence** — Sparkle accent representing quality achievement

### Logo Variants

| Variant | Use Case |
|---------|----------|
| `default` | Standard usage on light backgrounds |
| `gradient` | Hero sections, marketing materials |
| `minimal` | Small sizes, subtle placements |
| `monochrome` | Print, single-color contexts |
| `dark` | Dark backgrounds, overlays |
| `light` | Light backgrounds with brand colors |

### Logo Sizes

| Size | Use Case |
|------|----------|
| `xs` | Navigation, inline mentions |
| `sm` | Headers, cards |
| `md` | Standard usage (default) |
| `lg` | Section headers |
| `xl` | Landing pages |
| `hero` | App splash, marketing hero |

### Clear Space
Maintain minimum clear space around the logo equal to the height of the logo mark.

### Minimum Size
- Digital: 24px height minimum
- Print: 10mm height minimum

---

## Color Palette

### Primary Brand Colors
Psychology: Trust, Growth, Harmony, Balance, Community

| Color | HSL | Hex | Usage |
|-------|-----|-----|-------|
| Emerald 500 | `158 64% 39%` | `#10B981` | Primary actions, CTAs |
| Teal 500 | `168 76% 42%` | `#14B8A6` | Secondary accent |
| Cyan 500 | `188 94% 43%` | `#06B6D4` | Info, links |

### Accent Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Amber 400 | `#FBBF24` | Achievements, highlights, gamification |
| Yellow 300 | `#FDE047` | Sparkles, excellence indicators |

### Semantic Colors

| Purpose | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `#FFFFFF` | `#020817` |
| Foreground | `#020817` | `#F8FAFC` |
| Muted | `#F1F5F9` | `#1E293B` |
| Border | `#E2E8F0` | `#1E293B` |

### Gradient Definitions

**Primary Brand Gradient**
```css
background: linear-gradient(135deg, #10B981 0%, #0D9488 50%, #0891B2 100%);
```

**CTA Button Gradient**
```css
background: linear-gradient(to right, #10B981, #14B8A6, #0D9488);
```

---

## Typography

### Font Family
**Inter** — Modern, clean, highly legible at all sizes

### Type Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Hero | 48-64px | 900 (Black) | Landing page headlines |
| H1 | 32-40px | 800 (ExtraBold) | Page titles |
| H2 | 24-28px | 700 (Bold) | Section headers |
| H3 | 18-20px | 600 (SemiBold) | Card titles |
| Body | 14-16px | 400 (Regular) | Content |
| Small | 12-13px | 500 (Medium) | Labels, captions |
| Tiny | 10-11px | 500 (Medium) | Badges, meta info |

### Wordmark Typography
The "HostelMate" wordmark uses:
- **Hostel** — Emerald color (`text-emerald-600`)
- **Mate** — Foreground color (adapts to theme)

---

## Iconography

### Primary Icons
- Lucide React icon set for consistency
- 2px stroke width for standard icons
- 2.5px stroke width for emphasized icons

### App Icon
The app icon features:
- Rounded square container (112px radius at 512px)
- Brand gradient background
- White house/home mark
- Gold sparkle accent for excellence

---

## Motion & Animation

### Principles
- **Purposeful** — Animations guide attention, not distract
- **Smooth** — Use spring physics for natural feel
- **Fast** — Keep transitions under 300ms for responsiveness

### Standard Transitions
```typescript
// Button hover
transition: { type: "spring", stiffness: 400, damping: 17 }

// Page transitions
transition: { duration: 0.3, ease: "easeInOut" }

// Micro-interactions
transition: { duration: 0.15 }
```

---

## Voice & Tone

### Writing Principles
1. **Clear & Concise** — Get to the point quickly
2. **Encouraging** — Celebrate achievements, motivate action
3. **Inclusive** — Welcome all students from any background
4. **Helpful** — Guide users through features naturally

### Sample Copy

| Context | Example |
|---------|---------|
| Welcome | "Live Better, Together" |
| CTA | "Get Started Free" |
| Success | "Task completed! You've earned 10 points 🎉" |
| Empty State | "All caught up! No pending tasks" |
| Error | "Something went wrong. Let's try that again." |

---

## Component Patterns

### Cards
- Rounded corners: `rounded-2xl` (16px)
- Subtle border: `border-border/50`
- Optional gradient backgrounds for featured content

### Buttons
- Primary: Brand gradient with shadow
- Secondary: Outline with brand border
- Border radius: `rounded-xl` to `rounded-2xl`
- Min touch target: 44px height

### Forms
- Input background: `bg-muted/50`
- Focus ring: Brand emerald
- Clear labels and helpful placeholders

---

## Accessibility

### Color Contrast
- All text meets WCAG 2.1 AA standards
- Interactive elements have visible focus states
- Don't rely on color alone to convey meaning

### Touch Targets
- Minimum 44×44px for all interactive elements
- Adequate spacing between touch targets

### Motion
- Respect `prefers-reduced-motion`
- Provide alternative static states

---

## Usage Examples

### Correct Usage ✅
- Logo on clean, uncluttered backgrounds
- Sufficient clear space around logo
- Appropriate color contrast
- Consistent typography

### Incorrect Usage ❌
- Stretching or distorting the logo
- Placing logo on busy backgrounds
- Using unauthorized color combinations
- Modifying the sparkle accent

---

## Brand Assets

### Files Available
- `public/icon.svg` — Primary SVG icon
- `public/icon-192.png` — PWA icon 192px
- `public/icon-512.png` — PWA icon 512px
- `public/icon-maskable-*.png` — Maskable icons for Android

### Component Exports
```tsx
import { Logo, LogoMark, LogoWordmark } from "@/components/Logo";
```

---

*Last updated: January 2026*
*Version: 2.0*
