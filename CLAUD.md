# Yell into the Void

## Project Overview
A purely client-side web experience where users type text and watch it spiral into an animated black hole

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Animation**: HTML5 Canvas with requestAnimationFrame
- **Styling**: Tailwind CSS (minimal, dark space theme)

## Code Conventions
**CRITICAL**: This project uses `snake_case` for ALL naming conventions:

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
