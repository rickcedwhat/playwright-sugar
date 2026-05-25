# SyncStrategy

Describes how to synchronise state to a second page after `Director.ensureExists` creates a resource. Passed as `syncStrategy` in `ensureExists` options.

## SyncStrategies.default()

No-op sync. `bringToFront` is handled automatically by `Play.run()`, and the `exists` play handles its own navigation. Use this (or omit `syncStrategy`) when the second page polls or subscribes to updates automatically.

```ts
await director.ensureExists(adminPb, params, { syncTo: viewerPage });
// equivalent to:
await director.ensureExists(adminPb, params, {
  syncTo: viewerPage,
  syncStrategy: SyncStrategies.default(),
});
```

## SyncStrategies.withReload()

Reloads the sync target page (`waitUntil: 'domcontentloaded'`) before retrying `exists`. Use when the second page reads from localStorage or a polling endpoint that updates on page load.

```ts
await director.ensureExists(adminPb, params, {
  syncTo: viewerPage,
  syncStrategy: SyncStrategies.withReload(),
});
```

## SyncStrategies.custom(fn)

User-defined sync logic.

```ts
await director.ensureExists(adminPb, params, {
  syncTo: viewerPage,
  syncStrategy: SyncStrategies.custom(async page => {
    await page.evaluate(() => window.__refreshData());
    await page.waitForResponse('/api/datasets');
  }),
});
```
