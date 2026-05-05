# SportyX — Design System Handoff

## Overview
SportyX — мобильное спортивное приложение (футбол). Экраны: игроки, команды, события, площадки, профиль.

## Tech Stack (recommended)
- React Native / Expo
- Tailwind-style tokens via CSS custom properties (see `design-system/tokens.css`)

## Typography

Two font families:

| Token | Family | Usage |
|-------|--------|-------|
| `--font-display` | **Oswald** 600-700 | Page titles in green header (uppercase, 30px), large sport numbers (ratings, countdowns), event type labels ("ТРЕНИРОВКА", "ИГРА") |
| `--font-sans` | **Geist** 300-700 | Everything else — names, buttons, tabs, meta text, descriptions |

### When to use `font-display` (Oswald):
- Page title in `PageHeader` — uppercase, 30px, weight 600
- Rating numbers in circles — 24px, weight 700
- Countdown badges ("через 2д") — 20px
- Event type hero label ("ТРЕНИРОВКА", "ИГРА") — uppercase

### When to use `font-sans` (Geist):
- Player/team names (16px/600)
- Tab labels, section titles (14px/500-600)
- Meta text, descriptions (13px/400-500)
- Tag labels (11px/600)
- Button text (14px/600)

## Color System

### Brand Green (primary)
```
--green-900: #0e4a35
--green-800: #125a3f
--green-700: #15694a  ← primary, headers, active states
--green-600: #1a7a55
--green-500: #1f8a60
```

### Ink (neutrals)
```
--ink-900: #0c1411  ← primary text
--ink-700: #2b3733  ← secondary text
--ink-500: #5c6a65  ← tertiary text
--ink-400: #8a9994  ← placeholder, disabled
--ink-300: #b8c2bd  ← borders (subtle)
--ink-200: #dde3df  ← borders
--ink-100: #eef2ef  ← dividers, bg tint
```

### Surfaces
```
--bg:   #f6f7f5  ← page background
--card: #ffffff  ← cards, sheets
```

### Position Colors (semantic)
| Position | BG | FG | Icon |
|----------|----|----|------|
| НАП (Forward) | `#fde8ea` | `#c93545` | Boot (PNG mask) |
| ПЗЩ (Midfielder) | `#fff4dd` | `#c48a14` | Crosshair (SVG) |
| ЗАЩ (Defender) | `#e2f3e8` | `#1a7a45` | Shield (SVG) |
| ВРТ (Goalkeeper) | `#e0effd` | `#2a6ec2` | Glove (PNG mask) |

### Rating Tiers
| Tier | Range | Gradient start | Gradient end | Text | Track |
|------|-------|---------------|-------------|------|-------|
| Elite | 90-100 | `#6366f1` | `#4338ca` | `#4338ca` | `#e0e0f8` |
| High | 80-89 | `#f5b800` | `#d4920a` | `#b8860b` | `#fdf0c8` |
| Mid | 70-79 | `#b0b5ba` | `#8a8e93` | `#6b7280` | `#e8eaec` |
| Low | 55-69 | `#d4783a` | `#a85828` | `#8b4a20` | `#f2e0d0` |
| Poor | <55 | `#3f3f46` | `#18181b` | `#1c1917` | `#e4e4e7` |

Rating ring: SVG circle, `stroke-dasharray` proportional to score, `linearGradient` from c1→c2, starts at -90° (12 o'clock).

## Spacing Scale
```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px   ← default horizontal padding
--space-5:  20px   ← header padding
--space-6:  24px
--space-8:  32px
--space-10: 40px
```

## Border Radius
```
--radius-sm:   6px   ← tags
--radius-md:   10px  ← icon buttons
--radius-lg:   12px  ← inputs, chips, cards
--radius-xl:   18px  ← page header bottom corners
--radius-full: 999px ← pills, avatars
```

## Shadows
```
--shadow-sm: 0 1px 2px rgba(0,0,0,.06)
--shadow-md: 0 4px 12px rgba(0,0,0,.08)
--shadow-lg: 0 12px 32px rgba(0,0,0,.12)
```

## Components

### PageHeader
- Background: `--green-700`
- Bottom corners: `border-radius: 0 0 18px 18px`
- Diagonal stripe overlay: `repeating-linear-gradient(-55deg, transparent 0 14px, rgba(255,255,255,.06) 14px 16px)`
- Title: Oswald 600, 30px, uppercase, white
- Icon buttons: 34×34, radius 10px, `rgba(255,255,255,.12)` bg

### Tabs (horizontal)
- Background: white
- Items: flex, equal width, 14px/500, `--ink-500`
- Active: 14px/600, `--ink-900`, green underline (36×2.5px, `--green-700`, centered)
- Bottom border: 1px `--ink-100`

### SearchInput
- Height: 42px, radius 12px
- Background: `--bg`, border: 1px `--ink-100`
- Icon: 18px stroke search, `--ink-400`
- Placeholder: 14px, `--ink-400`

### Chip
- Height: 42px, radius 12px
- Background: white, border: 1px `--ink-200`
- Text: 14px/500, `--ink-900`

### FilterButton
- 42×42, radius 12px
- Background: white, border: 1px `--ink-200`
- Icon: funnel (18px stroke)

### SortPill
- Height: 32px, radius full (pill)
- Background: `#eaf3ee`
- Text: 13px/600, `--green-800`

### PositionTag
- Height: 22px, radius 6px, padding 0 8px
- Font: 11px/600, letter-spacing .04em
- Icon + label, 5px gap
- Colors per position (see table above)

### RatingRing
- Container: 56×56px, centered content
- SVG: two circles r=24, strokeWidth 3.5
- Background circle: tier track color
- Foreground circle: linearGradient, dasharray = `(2πr × rating/100)`, rotate -90°
- Number: Oswald 700, 24px, tier text color, centered

### Avatar + TeamBadge
- Avatar: 54×54, border-radius 50%, `object-fit: cover`
- Badge: 22×22, absolute bottom-right (-2px), border-radius 50%
- Badge: team color bg, white text 9px/700, 2px white border

### BottomTabBar
- Grid 4 columns, white bg, top border 1px `--ink-100`
- Padding: 8px 8px 6px
- Items: column flex, 3px gap, 11px/500, `--ink-400`
- Active: `--green-700`, font-weight 600
- Icons: 22-24px stroke

### Buttons
| Variant | BG | Text | Hover BG |
|---------|-----|------|----------|
| Primary | `--green-700` | white | `--green-800` |
| Secondary | `--ink-100` | `--ink-900` | `--ink-200` |
| Ghost | transparent + 1.5px `--green-700` border | `--green-700` | `rgba(21,105,74,.06)` |
| Danger | `--pos-fwd-fg` | white | `#a82d3e` |

Sizes: md (42px height, 20px padding, 14px, radius 12px), sm (32px, 14px padding, 13px, radius 10px)

## Icon Assets
- Boot icon (forward): `uploads/pasted-1777964657654-0.png` — use as CSS mask with `currentColor`
- Glove icon (goalkeeper): `uploads/pasted-1777964785667-0.png` — use as CSS mask with `currentColor`
- System icons: inline SVG, stroke style, 1.6-2px stroke width

## File Structure
```
design-system/
  tokens.css          ← CSS custom properties
  Design System.html  ← visual showcase of all components
Players.html          ← reference screen implementation
ios-frame.jsx         ← iOS device frame wrapper
uploads/
  pasted-1777964657654-0.png  ← boot icon
  pasted-1777964785667-0.png  ← glove icon
```

## Implementation Notes
- All colors use CSS custom properties from `tokens.css`
- Position icons (boot, glove) are PNGs used via CSS `mask-image` + `background-color: currentColor` to inherit tag text color
- Rating ring uses SVG `linearGradient` — in React Native, use `react-native-svg`
- Header stripe pattern is CSS `repeating-linear-gradient` — in RN, use an overlay image or SVG pattern
- Transitions: `150ms cubic-bezier(0.16, 1, 0.3, 1)` for interactive states
