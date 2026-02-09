# Stress Tracker Test Plan

## Manual testing
- Start breathing exercise and verify circle expands on "Pust inn", holds on "Hold", and shrinks on "Pust ut".
- Confirm the phase label changes each step and the breath counter increments after each full cycle.
- Tap "Stopp" and verify the breathing animation stops and the idle pulse resumes.
- Tap the affirmation refresh button and confirm the text changes and haptics trigger.
- Scroll the screen and verify layout spacing accounts for header and tab bar.
- Rapidly tap Start/Stop 5-10 times and confirm no overlapping animations or stalled phases.
- Background the app mid-cycle and return; confirm the phase label and animation resume consistently.
- Lock/unlock the device while breathing is active; confirm no stuck scale or opacity.
- Rotate the device (if supported) and verify layout and circle remain centered.
- Confirm haptics do not spam when Start/Stop is toggled quickly.
- Let the breathing run for 3+ cycles and confirm the counter stays accurate.

## Unit/behavior checks
- `BREATHING_PHASES` durations and labels map to the UI phase label.
- `getNewAffirmation()` always selects a value from `AFFIRMATIONS`.
- Breathing timeout is cleared when stopping or unmounting to avoid duplicate loops.
- Idle animation reactivates when `isBreathing` is false.

## Automation notes
- Add accessibility labels for Start/Stop buttons and the affirmation refresh button to make them targetable.
- Use a timer-mocking helper to fast-forward breathing phases without waiting real time.
- In Detox, assert the phase label text cycles: "Pust inn" -> "Hold" -> "Pust ut".
- In Playwright (web build), verify the breath count increments after a full cycle.
- Add a regression check that pressing Start twice does not create overlapping timers.
