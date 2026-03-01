# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SuperMemo Plan Web — a browser-based elastic schedule management app inspired by SuperMemo's Plan feature. It allows users to create daily schedules with activities that are automatically compressed/expanded to fit available time. Pure client-side app with localStorage persistence, no backend.

## Commands

All commands run from the `app/` directory:

```bash
cd app
npm install        # Install dependencies
npm run dev        # Start Vite dev server (HMR)
npm run build      # TypeScript check + Vite production build
npm run lint       # ESLint
npm run preview    # Preview production build locally
```

No test framework is configured.

## Architecture

### Core Domain: Elastic Schedule Engine (`src/lib/scheduleEngine.ts`)

The central algorithm. Key concepts:
- **Activity**: A scheduled item with desired `length` (minutes), computed `actLen` (actual allocated), `optLen` (optimum without constraints), and time fields (`start`, `optStart`)
- **Fixed (F)**: Activity pinned to a specific start time — manually editing start time auto-marks it as fixed
- **Rigid (R)**: Activity that won't be compressed — keeps its desired length
- **Anchor activities**: First activity = "Start" (schedule boundary), last = "End" (always fixed). Must always exist (minimum 2 activities)
- **Elastic compression**: Flexible (non-rigid) activities are proportionally compressed/expanded to fill time between fixed points and schedule end
- **Begin**: Starting an activity fixes it at current wall-clock time and recalculates all subsequent activities
- **Adjust**: Copies `actLen` → `length` for all activities (accept current reality as new plan)

### Data Flow

```
App.tsx (state owner)
  ├── useScheduleStorage (localStorage CRUD, settings)
  ├── calculateSchedule() called on every activity change
  ├── ScheduleToolbar (schedule CRUD, parameters)
  ├── ActivityTable (inline editing, drag reorder, begin/split/delete)
  ├── StatsPanel (delay offenders, progress, efficiency)
  ├── NotificationSettings (browser notifications config)
  └── CurrentTimeIndicator (live clock)
```

`App.tsx` owns all schedule state. `calculateSchedule()` is a pure function that recomputes the entire schedule from activities + startTime + totalHours. Components receive calculated results and fire callbacks upward.

### Storage

localStorage keys: `supermemo-plan-schedules`, `supermemo-plan-settings`, `supermemo-plan-current`. The `useScheduleStorage` hook handles all persistence with auto-save on state changes.

### Types (`src/types/index.ts`)

Core types: `Activity`, `Schedule`, `ScheduleStats`, `AppSettings`, `NotificationSettings`.

## Tech Stack

- React 19 + TypeScript 5.9 + Vite 7
- Tailwind CSS 3.4 + shadcn/ui (new-york style, slate base color, CSS variables)
- Path alias: `@/` → `src/`
- Icons: lucide-react
- Notifications: Browser Notification API + sonner toasts
- No routing library — single-page with tabs

## Conventions

- shadcn/ui components live in `src/components/ui/` — these are library code, avoid modifying
- Custom components in `src/components/` — mobile-first responsive design with `sm:` / `md:` / `lg:` breakpoints
- Custom hooks in `src/hooks/`
- Business logic in `src/lib/`
- All time values represented as `HH:MM` strings; internal calculations use minutes-from-midnight
- Keyboard shortcuts: Ctrl+S (save), Ctrl+N (new), Ctrl+Enter / Insert (add activity)

## Important Rules

- **删除文件前必须先询问用户确认** (Always ask before deleting any file)
- 使用中文回复
