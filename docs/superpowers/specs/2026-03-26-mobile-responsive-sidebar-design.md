# Mobile Responsive Sidebar

## Summary

Convert the fixed desktop sidebar into a responsive layout: hidden on mobile (<768px) with a burger menu that opens a Sheet slide-out, unchanged on desktop.

## Design Decisions

- **Breakpoint**: `md` (768px) — sidebar visible on desktop, hidden on mobile
- **Mobile top bar**: Burger icon (left) + "Linda" branding (center), visible only below `md`
- **Sheet**: shadcn Sheet component, slides from the left, contains the same nav items as the desktop sidebar
- **Auto-close**: Sheet closes when a nav link is tapped
- **Desktop**: Completely unchanged — same fixed `w-64` sidebar
- **Shared nav array**: Both desktop sidebar and mobile sheet reuse the same `navigation` array

## Files Changed

- `src/components/sidebar.tsx` — Add mobile header with burger icon + Sheet containing nav links. Desktop sidebar gets `hidden md:flex`.
- `src/app/layout.tsx` — Wrap layout to support both mobile header and desktop sidebar.

## Approach

1. In `sidebar.tsx`, export both a `Sidebar` (desktop, hidden on mobile) and a `MobileHeader` (mobile, hidden on desktop)
2. `MobileHeader` renders a top bar with a burger icon that triggers a shadcn Sheet from the left
3. The Sheet content reuses the same `navigation` array with the same styling
4. On nav link click, the Sheet closes via state setter
5. In `layout.tsx`, render both `MobileHeader` and `Sidebar` — Tailwind responsive classes handle visibility
