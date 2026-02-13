# Yell into the Void - Project Context

## Project Overview
A purely client-side web experience where users type text and watch it spiral into an animated black hole. **Zero data storage** — nothing is saved, no backend, no liability.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Animation**: HTML5 Canvas with requestAnimationFrame
- **Styling**: Tailwind CSS (minimal, dark space theme)

## Code Conventions
**CRITICAL**: This project uses `snake_case` for ALL naming conventions:
- Functions: `handle_yell()`, `spawn_text_particles()`
- Variables: `text_particles`, `black_hole_ref`, `is_animating`
- Component props: `on_yell`

**Do NOT change to camelCase** - maintain consistency with existing codebase.

## Project Structure
```
/app/              # Next.js App Router pages
  ├── page.tsx     # Main app (BlackHole + YellInput)
  ├── layout.tsx   # Root layout
  └── globals.css  # Minimal global styles

/components/       # React components
  ├── BlackHole.tsx   # Canvas animation (starfield, black hole, text particles)
  └── YellInput.tsx   # Text input with YELL button
```

## Architecture
- **No backend**: Purely client-side, no API calls, no database
- **Canvas animation**: Full-screen canvas with particle physics
- **Ref-based API**: Parent calls `black_hole_ref.current.yell(text)` to trigger animation
- **Type safety**: Strong TypeScript with defined interfaces

## Animation Details (BlackHole.tsx)
- **Starfield**: ~250 stars slowly drifting toward center
- **Accretion disk**: ~120 particles orbiting in purple/blue gradient
- **Black hole core**: Radial gradient from black to transparent with event horizon ring
- **Text particles**: On yell, text splits into characters that spiral inward with:
  - Increasing angular velocity as radius decreases
  - Scale shrinking with distance
  - Opacity fading near center
  - Rotation for distortion effect
  - Particles removed when radius < 10px

## Development Guidelines
1. Keep the UI minimal - just input, button, and canvas
2. No localStorage, no cookies, no analytics, no tracking
3. Performance: 60fps animation via requestAnimationFrame
4. Responsive: Canvas auto-resizes to viewport
5. Accessibility: Focus on textarea after yell completes

## Features
- Type up to 500 characters
- Press Enter (or click YELL) to launch text into void
- Text spirals into black hole with physics-based animation
- Input clears after yell, ready for next message
- Character counter
- Keyboard shortcuts (Enter to submit, Shift+Enter for newline)
