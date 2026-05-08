# Director

Runs plays from a `Playbook` and makes assertions about whether they succeeded or failed. The primary entry point for RBAC testing and fixture setup.

## assertCan

```ts
director.assertCan(
  playbook: Playbook,
  playName: string,
  params: unknown
): Promise<PlayResult>
```

Runs the named play and **throws** if it does not produce a success outcome. Use to assert that a user *can* perform an action.

```ts
const director = new Director();
const pb = datasetPb.withCtx({ page });

await director.assertCan(pb, 'create', { name: 'My Dataset' });
```

## assertCannot

```ts
director.assertCannot(
  playbook: Playbook,
  playName: string,
  params: unknown
): Promise<PlayResult>
```

Runs the named play and **throws** if it produces a success outcome. Use to assert that a user *cannot* perform an action.

```ts
await page.goto('/?role=viewer');
const result = await director.assertCannot(pb, 'create', { name: 'Blocked' });
expect(result.isSuccess).toBe(false);
```

## ensureExists

```ts
director.ensureExists(
  playbook: Playbook,
  params: unknown,
  opts?: { syncTo: Page; syncStrategy?: SyncStrategy }
): Promise<void>
```

Runs the `exists` play. If it returns a failure outcome, runs the `create` play. Requires the Playbook to define both `exists` and `create` plays.

If `syncTo` is provided, syncs state to a second page and retries `exists` there until it passes (up to 30 s).

```ts
// Ensure a dataset exists before the test body
await director.ensureExists(pb, { name: 'Fixture Dataset' });

// Ensure it's also visible on a second page
await director.ensureExists(adminPb, { name: 'Shared Dataset' }, {
  syncTo: viewerPage,
  syncStrategy: SyncStrategy.withReload(),
});
```

## PlayResult

```ts
type PlayResult = {
  isSuccess: boolean;
  outcome: string;
  data?: unknown;
}
```
