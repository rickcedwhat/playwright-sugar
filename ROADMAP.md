# 🚀 Playwright Sugar Roadmap (v0.1.0) 🗺️

This document tracks future "Sugar" helpers and architectural improvements planned for the library.

## 🚀 Upcoming Helpers

### 🧹 Passive Toast Cleaner (`withCleaner`)
- **Problem**: `addLocatorHandler` only triggers during a blocked action. Passive operations (like screenshots) or fast-moving tests can still be obstructed by non-blocking toasts or warnings.
- **Goal**: A wrapper that proactively checks for and clears known obstructions before executing a block of code.

### ⚖️ Stability Helper (`waitForStable`)
- **Problem**: Playwright clicks the center of a bounding box, but if the element is animating or shifting (e.g. a sliding modal), the click might land on the "old" coordinates.
- **Goal**: A utility that verifies an element's position has been unchanged for a short window (e.g. 100ms) before allowing an interaction.

### 📍 Atomic Navigation (`clickToURL`)
- **Problem**: Separating `click()` and `waitForURL()` makes it harder to provide rich error messages when navigation fails.
- **Goal**: An `attemptAction` based wrapper that clicks and confirms the landed URL in one step.

### 🤫 Network Silence (`waitForSilence`)
- **Problem**: Standard `networkidle` is often too slow or never fires in apps with constant polling.
- **Goal**: A helper that waits for a specific duration of network inactivity or for specific "Busy" APIs to finish.

## 🏗️ Architectural Ideas
- **Global Error Handling**: Automatically capturing browser logs and screenshots ONLY on `attemptAction` failures.
- **Automatic Retries for `verifiedFill`**: Enhancing `verifiedFill` to handle more complex state-reversion cases in specific frameworks.
- **Plugin System**: Allowing users to register global "Cleaners" that run before every `attemptAction`.
- **Custom Strategies Registry**: A global way to register and reuse scrolling/finding strategies.
- **Assertion-level Retries**: Expand `RecheckStrategy` to `assertCan` and `assertCannot` to retry checks (e.g., verifying deletion) without playbook-level retry configuration.
