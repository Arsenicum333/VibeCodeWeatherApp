# Agent instructions

This is a workshop demo app with two parts: fetching weather data from an OGC EDR service, and visualising it on a map with OpenLayers in Angular. It starts with a single `BitmapLayer` showing 2 m temperature; students extend it with new features.

## Adding features

Before adding or changing a feature, read [.agents/skills/extend-weather-map/SKILL.md](.agents/skills/extend-weather-map/SKILL.md). The most important rules:

- `src/app/visualizations/` holds only layers, renderers (and shaders), gradients and legend visualisation.
- Logic that works with the map's OpenLayers layers (listeners, collecting information from layers) goes in `MapLayersHelperService` (`src/app/map/map-layers-helper.service.ts`).
- Layers are created and configured in `createLayers()` in `src/app/map/map.ts`; keep it short and declarative.
- Layers are static: configure them through constructor options, without setters or update methods.

## No tests

This repository intentionally has no tests. Do not create test files (`*.spec.ts`, `*.test.ts`, e2e tests), install testing packages, or add test scripts or configuration. To check a change, run `npm run build` and look at the app with `npm start`.

The full rules are in [.agents/skills/no-tests/SKILL.md](.agents/skills/no-tests/SKILL.md).

## Skill copies

Every skill exists twice: in `.agents/skills/` (read by Codex, Cursor, Copilot and others) and in `.claude/skills/` (read by Claude Code). Keep both copies identical.
