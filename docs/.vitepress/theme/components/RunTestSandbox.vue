<script setup lang="ts">
import { computed, ref } from 'vue';

type Role = 'admin' | 'user';
type Action = 'create' | 'update' | 'delete';

const role = ref<Role>('admin');
const action = ref<Action>('create');
const copied = ref(false);

const grepBySelection: Record<Role, Record<Action, string>> = {
  admin: {
    create: 'assertCan: admin creates dataset from empty state',
    update: 'assertCan: admin renames dataset, cleanup reverts the rename',
    delete: 'assertCan: admin deletes dataset',
  },
  user: {
    create: 'assertCannot: viewer cannot create dataset',
    update: 'assertCannot: viewer cannot rename dataset, cleanup presses Escape',
    delete: 'assertCannot: viewer cannot delete dataset',
  },
};

const paramsByAction: Record<Action, string> = {
  create: "{ name: 'My Dataset' }",
  update: "{ name: 'Original Name', newName: 'Renamed' }",
  delete: "{ name: 'Delete Me' }",
};

const playByAction: Record<Action, string> = {
  create: 'create',
  update: 'update',
  delete: 'delete',
};

const labelByRole: Record<Role, string> = { admin: 'assertCan', user: 'assertCannot' };
const urlRoleByRole: Record<Role, string> = { admin: '', user: 'role=viewer&' };
const seedByAction: Record<Action, string> = {
  create: '',
  update: 'seed=Original%20Name&',
  delete: 'seed=Delete%20Me&',
};

const labQuery = computed(
  () => `${urlRoleByRole[role.value]}clear=1&${seedByAction[action.value]}`.replace(/&$/, '')
);

const runCommand = computed(
  () =>
    `pnpm test tests/director.spec.ts --grep "${grepBySelection[role.value][action.value]}"`
);

const codeSnippet = computed(() => {
  const assertion = labelByRole[role.value];
  const playName = playByAction[action.value];
  const roleSetup = role.value === 'user' ? "await page.goto('/?role=viewer');\n" : '';
  return [
    "const director = new Director();",
    "const adminPage = page;",
    "const userPage = page;",
    roleSetup + "const pb = datasetPb.withCtx({ page: " + (role.value === 'admin' ? 'adminPage' : 'userPage') + " });",
    `await director.${assertion}(pb, '${playName}', ${paramsByAction[action.value]});`,
  ].join('\n');
});

async function copyCommand(): Promise<void> {
  await navigator.clipboard.writeText(runCommand.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 1200);
}
</script>

<template>
  <div class="sandbox-wrap">
    <div class="controls">
      <div class="group">
        <button class="chip" :class="{ active: role === 'admin' }" @click="role = 'admin'">adminPage</button>
        <button class="chip" :class="{ active: role === 'user' }" @click="role = 'user'">userPage</button>
      </div>
      <div class="group">
        <button class="chip" :class="{ active: action === 'create' }" @click="action = 'create'">create</button>
        <button class="chip" :class="{ active: action === 'update' }" @click="action = 'update'">update</button>
        <button class="chip" :class="{ active: action === 'delete' }" @click="action = 'delete'">delete</button>
      </div>
    </div>

    <LabEmbed :query="labQuery" :height="430" />

    <p><strong>Snippet (updates with your selection):</strong></p>
    <pre><code>{{ codeSnippet }}</code></pre>

    <p><strong>Run this test:</strong> <code>{{ runCommand }}</code></p>
    <button class="run-btn" @click="copyCommand">{{ copied ? 'Copied' : 'Run this test (copy command)' }}</button>
  </div>
</template>

<style scoped>
.sandbox-wrap { margin-top: 12px; }
.controls { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.group { display: flex; gap: 8px; }
.chip {
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  padding: 6px 12px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
}
.chip.active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.run-btn {
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 8px;
  padding: 8px 12px;
  background: transparent;
  color: var(--vp-c-brand-1);
  cursor: pointer;
}
</style>
