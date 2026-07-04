# VegeLink Mobile Design System

This guide is extracted from the supplied VegeLink UI screenshots dated 2026-07-03. It is the visual source of truth for the Expo mobile app.

## Product Feel

VegeLink should feel friendly, local, trustworthy, and field-ready. The interface is soft and rounded, with bold dark headings, deep green primary actions, pale green success surfaces, and large touch targets. Screens should feel simple enough for first-time smartphone users while still polished for buyers and partners.

## Screen Inventory From References

- Onboarding slides for Farmers, Buyers, and Transporters.
- Role selection screen.
- Phone number entry screen.
- OTP verification screen.
- Personal details screen.
- Account success screen.
- Home dashboard.
- Browse produce grid/list screens.
- Filter bottom sheet.
- Produce detail and order quantity screen.
- Empty orders screen.
- Profile/settings screen.

## Colors

| Token | Hex | Use |
| --- | --- | --- |
| `brandGreen` | `#177A33` | Primary CTAs, active tabs, selected states |
| `brandGreenDark` | `#0F6A2B` | Header blocks, pressed states, brand text |
| `brandGreenSoft` | `#ECFDF3` | Selected cards, success panels, icon wells |
| `textInk` | `#111827` | Large headings and high-emphasis labels |
| `textBody` | `#5F6B7A` | Body copy and descriptions |
| `textMuted` | `#98A1B2` | Helper text, disabled labels, metadata |
| `surface` | `#FFFFFF` | Main screen background and cards |
| `surfaceSoft` | `#F7F8FA` | Inputs, page lower bands, neutral fills |
| `line` | `#E5E7EB` | Card/input borders |
| `warning` | `#F59E0B` | Ratings, small highlights, counters |
| `danger` | `#EF4444` | Sign out, errors, destructive states |
| `blue` | `#2563EB` | Transport and distance accents |

## Typography

- Headings: extra-bold, rounded-feeling, dark ink. Use `font-black` or `font-bold`.
- Large screen titles: 28-32px equivalent (`text-3xl`).
- Section titles: 16-18px equivalent (`text-lg`).
- Body: 14-16px, medium gray, relaxed line-height.
- Eyebrows: uppercase, 12px, bold, orange or green.
- Buttons: bold, centered, 16px.

The screenshots use a playful rounded display face. Until a bundled font is chosen, use strong weights and generous spacing to approximate it.

## Shape And Layout

- Phone-first vertical screens.
- Standard horizontal padding: 20-24px.
- Cards: 16-24px radius in visual references. In code, use `rounded-2xl` for major cards and `rounded-xl` for controls.
- Primary buttons: tall, full-width, rounded-2xl, green, with soft shadow.
- Inputs: rounded-2xl, pale neutral fill or white with green focused border.
- Bottom tabs: white background, pale green active icon well, muted inactive labels.
- Bottom sheets: rounded top corners, dimmed backdrop, bold title.
- Empty states: centered icon well, concise title, body copy, primary CTA.

## Interaction Rules

- Do not use icon-only critical actions. Pair icons with text for CTAs.
- All primary tap targets should be at least 48px tall.
- Role selection uses full cards with icon well, title, local language label, description, and selected check.
- OTP uses six individual rounded boxes visually, even if backed by a single input.
- Produce cards support both grid and list modes.
- Filter state should be visible through selected chips and selected region pills.

## Mobile App Implementation Notes

- Keep domain data shaped like backend DTOs and entities.
- Use local mock data until endpoints are ready, but name fields after backend concepts.
- Commit after each screen update.
- Avoid decorative complexity that hurts low-end Android performance.
