# Expo SDK Upgrade Plan (Mobile App Template)

> **✅ COMPLETED** - Upgrade verified 2025-12-14

**Final template versions (December 2025)**
- Expo SDK: `^54.0.3` ✅
- React Native: `0.81.4` ✅
- React: `19.1.0` ✅
- Vulnerabilities: **0** (was 12 production, 8 dev)

---

<details>
<summary>Original Plan (Historical Reference)</summary>

**Original baseline (November 4, 2025)**
- Expo SDK: `~49.0.15`
- React Native: `0.72.6`
- React Navigation: `6.x`
- Tooling: Jest 29, ESLint 8.44, Metro preset 0.76
- Vulnerabilities highlighted by `npm audit`: `ip` (SSRF), `semver` (ReDoS), `send` (template injection), `cookie` / `tmp` (via Lighthouse CLI)

## Upgrade Objectives
1. Move the template to Expo SDK 51 (or 52 if stable) to gain patched dependencies and Hermes improvements.
2. Eliminate high-severity advisories raised by the current CLI toolchain.
3. Maintain Jest-based unit tests and lint workflow with minimal breaking changes.
4. Document migration/rollback steps for template consumers.

## Proposed Timeline
| Phase | Target Week | Milestones |
| --- | --- | --- |
| Discovery | Week of Nov 10 | Confirm latest Expo release, review migration guides (Expo 49 → 50 → 51/52), inventory breaking changes. |
| Implementation | Week of Nov 17 | Update dependencies, adjust config files, run automated upgrades with `npx expo install`. |
| Verification | Week of Nov 24 | Run lint/test/build (`expo prebuild`, `expo run:ios/android --no-install`, `npm test`), smoke tests, manual QA on iOS/Android simulators. |
| Documentation & Release | Week of Dec 1 | Update template README, quickstart, release notes, and CI docs; publish new release entry. |

## Upgrade Checklist
### 1. Dependency Updates
- Run `npx expo install --fix` to align Expo-managed packages.
- Manually bump `expo`, `react-native`, `@react-navigation/*`, `react-native-reanimated`, and `expo-router` (if adopted).
- Replace deprecated packages:
  - `@testing-library/jest-native` → use built-in matchers in `@testing-library/react-native` ≥12.4.
  - Remove legacy Metro plugins replaced by Expo’s new presets.
- Update dev tooling:
  - ESLint 9 (or current LTS) with Expo plugin.
  - Jest 30 (or latest supported by Expo SDK 51+) with `jest-expo`.
  - TypeScript minimum version recommended by Expo (51 typically requires ≥5.2).

### 2. Configuration Changes
- Update `babel.config.js` to use `@react-native/babel-preset` and Expo 51 plugin recommendations.
- Refresh `app.json` / `app.config.ts` with new runtime version schema if required.
- Regenerate `eas.json` or build profiles if Expo CLI demands changes.
- Update Jest config: remove deprecated `cleanup-after-each`, rely on built-in matchers, ensure `transformIgnorePatterns` matches new package sets.

### 3. Codebase Adjustments
- Verify imports affected by Expo 51 removals (e.g., `expo-constants` API changes).
- Update navigation code if React Navigation 7 (if adopted) introduces API shifts.
- Replace placeholder sign-out `console.log` with a stub function to keep linting strict.
- Add polyfills or fallback logic for new runtime behaviors (e.g., changed font loading).

### 4. Testing Strategy
- Automated:
  - `npm run lint`
  - `npm test`
  - `expo doctor --fix-dependencies`
  - `npx expo prebuild --clean` to ensure templates build for native platforms.
- Manual:
  - Launch iOS Simulator (Debug + Production modes).
  - Launch Android Emulator (Debug + Production).
  - Validate offline functionality, navigation stack, and push notification placeholder flows.
- CI:
  - Update GitHub Actions matrix to use Node 20.x with Expo CLI 1.x.
  - Add optional `expo-doctor` step inside smoke tests to catch config drift.

### 5. Documentation Updates
- Template README:
  - New SDK/React Native versions.
  - Updated Expo CLI commands (`npx expo run` vs `expo start` variants).
  - Platform build prerequisites (Xcode 15.x, Android Studio Giraffe/Koala).
- `docs/template-quickstart.md`: reflect new install commands and mention `npm ci`.
- Release notes (`docs/releases/`): record upgrade, testing, and remaining caveats.
- Operations/Dependency docs: add Expo SDK to quarterly review checklist.

### 6. Risk Mitigation
- Maintain a fallback branch (`mobile-app/expo49`) until SDK 51 rollout is stable.
- Document known issues (e.g., React Native 0.74 Hermes regressions, Expo CLI plugin warnings).
- Provide guidance for template consumers on upgrading existing apps (diff-based instructions).

### 7. Acceptance Criteria
- `npm audit --audit-level high` reports no high-severity vulnerabilities post-upgrade.
- All lint/tests/build commands succeed on Node 20.
- Template runs on iOS and Android simulators without crash.
- Documentation and quickstart are updated and reviewed.
- Release notes published with validation matrix and manual test checklist.

---
**Next Actions**
1. Collect Expo 51 release notes and migration steps.
2. Set up a feature branch for dependency bumps with automated smoke tests.
3. Schedule manual QA windows and update the quarterly dependency review to include Expo SDK targets.

</details>
