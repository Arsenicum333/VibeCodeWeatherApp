---
name: no-tests
description: Use whenever writing, generating, or changing code in this repository, and whenever anyone asks for unit, component, or end-to-end tests. This is an OpenLayers workshop demo that must stay free of tests and test tooling.
---

# No tests in this repository

This repository is a demo app for a workshop that teaches how to build map applications with OpenLayers in Angular. It intentionally contains no tests, so that students can focus on OpenLayers and change the app freely without failing tests getting in the way.

## Rules

- Do not create test files: no `*.spec.ts`, `*.test.ts`, `*.e2e.ts`, or test folders such as `e2e/` or `__tests__/`.
- Do not install testing packages, for example `vitest`, `jsdom`, `jasmine`, `karma`, `jest`, `@testing-library/*`, `playwright`, or `cypress`.
- Do not add test configuration: no `test` script in `package.json`, no `test` target in `angular.json`, no `tsconfig.spec.json`, and no test entries in `.vscode/tasks.json` or `.vscode/launch.json`.
- When using `ng generate`, keep the project setting that skips spec files. Never pass `--skip-tests=false`.
- If someone explicitly asks for tests, explain that this workshop repository deliberately has none, and ask them to confirm before going against that.

## How to check a change instead

1. Run `npm run build` and fix any compile errors.
2. Run `npm start`, open http://localhost:4200, and check the map in the browser.
