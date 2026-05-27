<script setup lang="ts">
import {
  CREATE_PHASES,
  type CreatePhaseId,
  type DetectChoice,
  type OutcomeChoice,
  type LineVisual,
  type RoleChoice,
  adminCannotDemoFailure,
  getLineVisual,
  OUTCOME_BRANCHES,
  phaseBullets,
  phaseTitles,
  playbookLines,
  viewerCannotReachSuccess,
} from './play-explorer/createTour';
import { tokenizeTsLine } from './play-explorer/tsHighlight';
import { computed, onUnmounted, ref, watch } from 'vue';

const ROLE_OPTS: RoleChoice[] = ['admin', 'viewer'];
const PHASES = [...CREATE_PHASES];

const MOCK_TABLE_ROWS = ['Seeded Dataset', 'Regional metrics · FY25', 'Lab regression row'];

const phaseIndex = ref(0);
const role = ref<RoleChoice>('admin');
const playId = ref<'create'>('create');
const detect = ref<DetectChoice>('empty');
const outcome = ref<OutcomeChoice | null>('success');

const phase = computed<CreatePhaseId>(() => PHASES[phaseIndex.value]!);

type SchematicKind =
  | 'home'
  | 'empty'
  | 'table'
  | 'detail'
  | 'toastEmpty'
  | 'toastTable'
  | 'timeoutDirector';

const mockOnDatasets = computed(() => phase.value !== 'overview');

const schematic = computed<SchematicKind>(() => {
  if (phase.value === 'overview') return 'home';

  if (outcome.value === 'timeout' && phase.value === 'director') return 'timeoutDirector';

  if (phase.value === 'outcomes') {
    if (outcome.value === 'success') return 'detail';
    if (outcome.value === 'failure') return detect.value === 'table' ? 'toastTable' : 'toastEmpty';
    if (outcome.value === 'timeout') return detect.value === 'table' ? 'table' : 'empty';
  }

  if (phase.value === 'nav' || phase.value === 'detect' || phase.value === 'attempt') {
    return detect.value === 'table' ? 'table' : 'empty';
  }

  if (outcome.value === 'success') return 'detail';
  if (outcome.value === 'failure') return detect.value === 'table' ? 'toastTable' : 'toastEmpty';
  if (outcome.value === 'timeout') return 'timeoutDirector';
  return 'empty';
});

const showTimeoutCountdown = computed(
  () => outcome.value === 'timeout' && (phase.value === 'outcomes' || phase.value === 'director'),
);

const timeoutDemoSec = ref(0);
let timeoutDemoIntervalId: ReturnType<typeof setInterval> | null = null;

function clearTimeoutDemoInterval(): void {
  if (timeoutDemoIntervalId !== null) {
    clearInterval(timeoutDemoIntervalId);
    timeoutDemoIntervalId = null;
  }
}

function restartTimeoutDemo(): void {
  clearTimeoutDemoInterval();
  timeoutDemoSec.value = 3;
  let step = 0;
  timeoutDemoIntervalId = window.setInterval(() => {
    step++;
    timeoutDemoSec.value = Math.max(0, 3 - step);
    if (step >= 3) clearTimeoutDemoInterval();
  }, 1000);
}

watch(
  () => [phase.value, outcome.value] as const,
  ([p, o]) => {
    clearTimeoutDemoInterval();
    if (o === 'timeout' && (p === 'outcomes' || p === 'director')) restartTimeoutDemo();
    else timeoutDemoSec.value = 0;
  },
  { immediate: true },
);

/** Which flow-chart segment matches the current tour step (Next/Back). */
type FlowTourSeg = 'nav' | 'detect' | 'attemptAction' | 'outcomes';

const tourFlowSeg = computed((): FlowTourSeg | null => {
  switch (phase.value) {
    case 'overview':
      return null;
    case 'nav':
      return 'nav';
    case 'detect':
      return 'detect';
    case 'attempt':
      return 'attemptAction';
    case 'outcomes':
      return 'outcomes';
    case 'director':
      return null;
    default:
      return null;
  }
});

function flowHeadClass(kind: 'nav' | 'detect' | 'attempt'): Record<string, boolean> {
  const t = tourFlowSeg.value;
  return {
    'fc-head--tour':
      (kind === 'nav' && t === 'nav') ||
      (kind === 'detect' && t === 'detect') ||
      (kind === 'attempt' && t === 'attemptAction'),
  };
}

function setDetect(d: DetectChoice): void {
  detect.value = d;
}

function setOutcome(o: OutcomeChoice): void {
  if (o === 'success' && viewerCannotReachSuccess(role.value)) return;
  if (o === 'failure' && adminCannotDemoFailure(role.value)) return;
  outcome.value = o;
}

function flowOutcomePopKey(ob: OutcomeChoice): FlowPopKey {
  if (ob === 'success') return 'outcomeSuccess';
  if (ob === 'failure') return 'outcomeFailure';
  return 'outcomeTimeout';
}

function resetTour(): void {
  phaseIndex.value = 0;
  detect.value = 'empty';
  outcome.value = viewerCannotReachSuccess(role.value) ? null : 'success';
}

/** Snippet stays the static playbook excerpt, always in collapsed “overview” form (tour phase does not change it). */
const codeView = computed(() => ({
  lines: playbookLines(),
  highlight: null as const,
}));

const playbookLineCount = computed(() => playbookLines().length);

function lineVisualAt(i: number): LineVisual {
  const n = playbookLineCount.value;
  const total = codeView.value.lines.length;
  return getLineVisual(i + 1, [n + 1, n + 1], n, total);
}

function lineRowClasses(i: number): Record<string, boolean> {
  const v = lineVisualAt(i);
  return {
    'pe-line-hi': false,
    'pe-line-hidden': v.kind === 'hidden',
    'pe-line-collapsed': false,
  };
}

function collapsedLabel(i: number): string | null {
  const v = lineVisualAt(i);
  return v.kind === 'collapsed' ? v.label : null;
}

function lineShowsFullSourceTokens(i: number): boolean {
  return lineVisualAt(i).kind === 'full';
}

function lineShowsCollapsedTokenRow(i: number): boolean {
  return lineVisualAt(i).kind === 'collapsed';
}

type FlowPopKey = 'nav' | 'detectEmpty' | 'detectTable' | 'attempt' | 'outcomeSuccess' | 'outcomeFailure' | 'outcomeTimeout';

const flowSnippets = computed(() => {
  const L = playbookLines();
  const j = (a: number, b: number) => L.slice(a - 1, b).join('\n');
  return {
    nav: j(3, 5),
    detectEmpty: j(8, 12),
    detectTable: j(13, 17),
    attempt: j(22, 30),
    outcomeSuccess: j(32, 32),
    outcomeFailure: j(33, 37),
    outcomeTimeout: j(38, 38),
  } satisfies Record<FlowPopKey, string>;
});

const flowPop = ref<{ key: FlowPopKey; left: number; top: number } | null>(null);
let flowPopHideTimer: ReturnType<typeof setTimeout> | null = null;

function clearFlowPopHide(): void {
  if (flowPopHideTimer !== null) {
    clearTimeout(flowPopHideTimer);
    flowPopHideTimer = null;
  }
}

function flowPopOpen(key: FlowPopKey, ev: MouseEvent): void {
  clearFlowPopHide();
  const el = ev.currentTarget as HTMLElement | null;
  if (!el) return;
  const r = el.getBoundingClientRect();
  /** Anchor top-right of trigger; pop uses translate so its bottom-right sits here (popover opens up-left). */
  flowPop.value = { key, left: r.right + 6, top: r.top - 6 };
}

function flowPopScheduleHide(): void {
  clearFlowPopHide();
  flowPopHideTimer = setTimeout(() => {
    flowPop.value = null;
    flowPopHideTimer = null;
  }, 220);
}

function flowPopPanelEnter(): void {
  clearFlowPopHide();
}

onUnmounted(() => {
  clearFlowPopHide();
  clearTimeoutDemoInterval();
});

const headings = computed(() => phaseTitles(phase.value));
const bullets = computed(() => phaseBullets(phase.value));

const lastIndex = PHASES.length - 1;

const canPrev = computed(() => phaseIndex.value > 0);

const canNextManual = computed(() => phaseIndex.value < lastIndex);

function goPrev(): void {
  if (!canPrev.value) return;
  phaseIndex.value--;
}

function goNextManual(): void {
  if (!canNextManual.value) return;
  phaseIndex.value++;
}

const picksSummary = computed(() => {
  const bits: { k: string; v: string | null }[] = [
    { k: 'Role', v: role.value },
    { k: 'Detect', v: detect.value },
    { k: 'Outcome rehearsal', v: outcome.value },
  ];
  return bits;
});

watch(role, resetTour);
watch(playId, resetTour);

/** Tour-step affordances on the static mock (not a live browser). */
const tourPointerNav = computed(() => phase.value === 'nav');
const tourPulseNavTarget = computed(() => phase.value === 'nav');
const tourNavClickBurst = computed(() => phase.value === 'nav');
const tourPointerAttempt = computed(() => phase.value === 'attempt');
const attemptPointerAim = computed(() => (detect.value === 'table' ? 'plus' : 'create'));
const tourPulseEmptyCta = computed(() => phase.value === 'attempt' && schematic.value === 'empty');
const tourPulsePlusCol = computed(() => phase.value === 'attempt' && schematic.value === 'table');
const tourPulseDetailCopy = computed(() => phase.value === 'director' && outcome.value === 'success');
</script>

<template>
  <div class="pe">
    <!-- Row 1: snippet + flow chart (left) + illustrative UI (right) -->
    <div class="pe-top">
      <div class="pe-code-col" aria-label="Playbook snippet and flow">
        <div class="pe-code-wrap language-ts">
          <div class="pe-code-lang">TypeScript</div>
          <pre class="pe-code-pre"><code><span
              v-for="(line, i) in codeView.lines"
              :key="i"
              class="pe-line"
              :class="lineRowClasses(i)"
              ><span class="pe-ln">{{ String(i + 1).padStart(2, ' ') }}</span
              ><template v-if="lineShowsFullSourceTokens(i)"
                ><span class="pe-lc pe-lc-code"
                  ><span
                    v-for="(tok, ti) in tokenizeTsLine(line)"
                    :key="ti"
                    :class="tok.cls"
                    >{{ tok.text }}</span></span
                ></template
              ><template v-else-if="lineShowsCollapsedTokenRow(i)"
                ><span class="pe-lc pe-lc-code"
                  ><span
                    v-for="(tok, ti) in tokenizeTsLine(collapsedLabel(i)!)"
                    :key="ti"
                    :class="tok.cls"
                    >{{ tok.text }}</span></span
                ></template
              ><span v-else-if="collapsedLabel(i) !== null" class="pe-lc pe-lc-collapsed">{{ collapsedLabel(i) }}</span></span
            ></code></pre>
        </div>

        <div class="pe-flowchart" role="region" aria-label="Play flow">
          <div class="pe-flowchart-title">Play flow</div>
          <div class="pe-flowchart-track">
            <div class="fc-seg">
              <span class="fc-seg-label" :class="flowHeadClass('nav')">.nav</span>
              <div class="fc-seg-body">
                <div
                  class="fc-pill fc-pill--static fc-pill--pop"
                  tabindex="0"
                  aria-haspopup="dialog"
                  :aria-expanded="flowPop?.key === 'nav'"
                  aria-controls="flow-popover"
                  @mouseenter="flowPopOpen('nav', $event)"
                  @mouseleave="flowPopScheduleHide"
                  @focus="flowPopOpen('nav', $event)"
                  @blur="flowPopScheduleHide"
                >
                  Datasets
                </div>
              </div>
            </div>
            <div class="fc-arr" aria-hidden="true"><span class="fc-arr-glyph">→</span></div>

            <div class="fc-seg">
              <span class="fc-seg-label" :class="flowHeadClass('detect')">.detect</span>
              <div class="fc-seg-body">
                <div class="fc-branch">
                  <button
                    type="button"
                    class="fc-opt"
                    :class="{ 'fc-opt--on': detect === 'empty', 'fc-opt--off': detect !== 'empty' }"
                    aria-haspopup="dialog"
                    :aria-expanded="flowPop?.key === 'detectEmpty'"
                    aria-controls="flow-popover"
                    @click="setDetect('empty')"
                    @mouseenter="flowPopOpen('detectEmpty', $event)"
                    @mouseleave="flowPopScheduleHide"
                    @focus="flowPopOpen('detectEmpty', $event)"
                    @blur="flowPopScheduleHide"
                  >
                    empty
                  </button>
                  <button
                    type="button"
                    class="fc-opt"
                    :class="{ 'fc-opt--on': detect === 'table', 'fc-opt--off': detect !== 'table' }"
                    aria-haspopup="dialog"
                    :aria-expanded="flowPop?.key === 'detectTable'"
                    aria-controls="flow-popover"
                    @click="setDetect('table')"
                    @mouseenter="flowPopOpen('detectTable', $event)"
                    @mouseleave="flowPopScheduleHide"
                    @focus="flowPopOpen('detectTable', $event)"
                    @blur="flowPopScheduleHide"
                  >
                    table
                  </button>
                </div>
              </div>
            </div>
            <div class="fc-arr" aria-hidden="true"><span class="fc-arr-glyph">→</span></div>

            <div class="fc-attempt-span">
              <span class="fc-seg-label fc-seg-label--span" :class="flowHeadClass('attempt')">.attempt</span>
              <div class="fc-attempt-cols">
                <div class="fc-subcol fc-subcol--action">
                  <div class="fc-seg-body">
                    <div
                      class="fc-pill fc-pill--static fc-pill--pop"
                      tabindex="0"
                      aria-haspopup="dialog"
                      :aria-expanded="flowPop?.key === 'attempt'"
                      aria-controls="flow-popover"
                      @mouseenter="flowPopOpen('attempt', $event)"
                      @mouseleave="flowPopScheduleHide"
                      @focus="flowPopOpen('attempt', $event)"
                      @blur="flowPopScheduleHide"
                    >
                      action
                    </div>
                  </div>
                </div>
                <div
                  class="fc-subcol fc-subcol--outcomes"
                  :class="{ 'fc-col--tour': tourFlowSeg === 'outcomes' }"
                >
                  <div class="fc-seg-body">
                    <div class="fc-branch">
                      <button
                        v-for="ob in OUTCOME_BRANCHES"
                        :key="ob"
                        type="button"
                        class="fc-opt"
                        :class="{ 'fc-opt--on': outcome === ob, 'fc-opt--off': outcome !== ob }"
                        :disabled="
                          (ob === 'success' && viewerCannotReachSuccess(role)) ||
                          (ob === 'failure' && adminCannotDemoFailure(role))
                        "
                        aria-haspopup="dialog"
                        :aria-expanded="flowPop?.key === flowOutcomePopKey(ob)"
                        aria-controls="flow-popover"
                        @click="setOutcome(ob)"
                        @mouseenter="flowPopOpen(flowOutcomePopKey(ob), $event)"
                        @mouseleave="flowPopScheduleHide"
                        @focus="flowPopOpen(flowOutcomePopKey(ob), $event)"
                        @blur="flowPopScheduleHide"
                      >
                        {{ ob }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Teleport to="body">
        <div
          v-if="flowPop"
          id="flow-popover"
          class="fc-flow-pop"
          :style="{ left: flowPop.left + 'px', top: flowPop.top + 'px' }"
          role="tooltip"
          @mouseenter="flowPopPanelEnter"
          @mouseleave="flowPopScheduleHide"
        >
          <pre class="fc-flow-pop-pre">{{ flowSnippets[flowPop.key] }}</pre>
        </div>
      </Teleport>

      <section class="pe-illustration" aria-label="Illustrative Sugar Lab UI">
        <div class="pe-illustration-head">
          <span class="pe-ill-label">Illustrative UI</span>
          <span class="pe-ill-caption"
            >Follows the flow chart under the snippet. Use Next / Back — the active tour step is outlined there.</span
          >
        </div>
        <div class="pe-illustration-stack">
          <div
            class="mock-shell"
            :class="{ 'mock-shell--aim-plus': tourPointerAttempt && attemptPointerAim === 'plus' }"
            :data-mode="schematic"
            :data-phase="phase"
          >
            <div
              v-if="tourPointerNav"
              class="mock-tour-pointer mock-tour-pointer--nav"
              aria-hidden="true"
            >
              <svg class="mock-tour-pointer-svg" viewBox="0 0 24 24" width="34" height="34" role="presentation">
                <path
                  fill="currentColor"
                  d="M5.5 3.21C5.5 2.38 6.62 1.94 7.25 2.47L20.13 13.6c.6.52.27 1.5-.55 1.5H14l-1.87 6.05c-.22.7-1.12.89-1.6.34L5.5 14.25V3.21Z"
                />
              </svg>
            </div>
            <div
              v-if="tourPointerAttempt"
              class="mock-tour-pointer mock-tour-pointer--attempt"
              aria-hidden="true"
            >
              <svg class="mock-tour-pointer-svg" viewBox="0 0 24 24" width="34" height="34" role="presentation">
                <path
                  fill="currentColor"
                  d="M5.5 3.21C5.5 2.38 6.62 1.94 7.25 2.47L20.13 13.6c.6.52.27 1.5-.55 1.5H14l-1.87 6.05c-.22.7-1.12.89-1.6.34L5.5 14.25V3.21Z"
                />
              </svg>
            </div>

            <aside class="mock-side">
              <div class="mock-brand">Sugar Lab</div>
              <div class="mock-nav" :class="{ sel: !mockOnDatasets }">Home</div>
              <div
                class="mock-nav"
                :class="{
                  sel: mockOnDatasets,
                  'mock-tour-pulse': tourPulseNavTarget,
                  'mock-tour-nav-click': tourNavClickBurst,
                }"
              >
                Datasets
              </div>
              <div class="mock-nav">Settings</div>
              <div v-if="role === 'viewer'" class="mock-pill">viewer</div>
            </aside>

            <main class="mock-main">
              <template v-if="schematic === 'home'">
                <h4 class="mock-h">Home</h4>
                <p class="mock-quiet">You are on the landing shell — the play’s <code>.nav</code> opens Datasets next.</p>
                <div class="mock-placeholder">
                  <p>Welcome back</p>
                  <small>Recent runs and shortcuts would live in the real app.</small>
                </div>
              </template>

              <template v-else-if="schematic === 'timeoutDirector'">
                <h4 class="mock-h">Play timed out</h4>
                <p class="mock-quiet">
                  Your rehearsal picked <strong>timeout</strong> — the run ends when neither headline nor toast beats
                  <code>3_000</code> ms.
                </p>
              </template>

              <template v-else-if="schematic === 'empty' || schematic === 'toastEmpty'">
                <h4 class="mock-h">Datasets</h4>
                <p class="mock-quiet">Nothing persisted — empty locator path.</p>
                <button
                  type="button"
                  class="mock-primary mock-primary--hit"
                  :class="{ 'mock-tour-pulse': tourPulseEmptyCta, 'mock-tour-click': tourPulseEmptyCta }"
                  tabindex="-1"
                >
                  Create Dataset
                </button>
                <p v-if="schematic === 'toastEmpty'" class="mock-caption">Denial toast overlays the empty list.</p>
              </template>

              <template v-else-if="schematic === 'table' || schematic === 'toastTable'">
                <h4 class="mock-h">Datasets</h4>
                <p class="mock-quiet">Three rows satisfy the table headers locator.</p>
                <div class="mock-table mock-table--4" data-component="TableHeadersComponent">
                  <div class="mock-th">
                    <span>Name</span>
                    <span></span>
                    <span></span>
                    <span class="mock-th-action">
                      <button
                        type="button"
                        class="mock-icon-add"
                        :class="{ 'mock-tour-pulse': tourPulsePlusCol, 'mock-tour-click': tourPulsePlusCol }"
                        tabindex="-1"
                        aria-label="New dataset"
                      >
                        +
                      </button>
                    </span>
                  </div>
                  <div v-for="(row, ri) in MOCK_TABLE_ROWS" :key="row" class="mock-tr">
                    <span>{{ row }}</span>
                    <span class="muted">ID‑{{ ri + 1 }}</span>
                    <span class="muted">⋯</span>
                    <span class="mock-td-action muted"> </span>
                  </div>
                </div>
              </template>

              <template v-else-if="schematic === 'detail'">
                <h4 class="mock-h xl">Tutorial Dataset</h4>
                <p class="mock-muted" :class="{ 'mock-tour-pulse': tourPulseDetailCopy }">This dataset is empty</p>
                <small class="mock-caption">Matches `Outcomes.success` watching for that copy.</small>
              </template>

              <div
                v-if="schematic === 'toastEmpty' || schematic === 'toastTable'"
                class="mock-toast--failure mock-toast--float"
                role="status"
                data-sonner-toast=""
              >
                Failed to create dataset
              </div>

              <div
                v-if="showTimeoutCountdown"
                class="mock-timeout-countdown"
                role="status"
                aria-live="polite"
              >
                <span class="mock-timeout-countdown-k">Outcomes.timeout (3s)</span>
                <span class="mock-timeout-countdown-v">
                  <template v-if="timeoutDemoSec > 0">Waiting… {{ timeoutDemoSec }}s left</template>
                  <template v-else>0s — neither success nor failure locator appeared first.</template>
                </span>
              </div>
            </main>
          </div>
        </div>
      </section>
    </div>

    <!-- Row 2: full-width tour -->
    <section class="pe-tour pe-step-panel" role="region" aria-label="Tour steps and controls">
        <div class="pe-toolbar">
          <div class="pe-row">
            <button type="button" class="pe-btn ghost" @click="resetTour">Restart tour</button>
            <span class="pe-spacer" />
            <button type="button" class="pe-btn" :disabled="!canPrev" @click="goPrev">← Back</button>
            <button type="button" class="pe-btn primary" :disabled="!canNextManual" @click="goNextManual">
              Next →
            </button>
          </div>
          <div class="pe-row compact">
            <label class="pe-label">
              Role
              <select v-model="role" class="pe-select">
                <option v-for="r of ROLE_OPTS" :key="r" :value="r">{{ r }}</option>
              </select>
            </label>
            <label class="pe-label">
              Play
              <select v-model="playId" class="pe-select" disabled>
                <option value="create">create</option>
              </select>
            </label>
            <small class="pe-hint"
              >Snippet stays collapsed; hover flow nodes for the matching code. Next / Back moves the tour and chart outline.</small
            >
          </div>
        </div>

        <p class="eyebrow">{{ `Step ${phaseIndex + 1} · ${phase}` }}</p>
        <h3 class="pe-step-title">{{ headings.title }}</h3>
        <p class="pe-step-hint">{{ headings.hint }}</p>

        <ul class="pe-bullets">
          <li v-for="(b, bi) in bullets" :key="bi">{{ b }}</li>
        </ul>

        <div class="pe-picks">
          <p class="pe-picks-title">Current rehearsal</p>
          <ul class="pe-picks-list">
            <li v-for="(row, pi) in picksSummary" :key="pi">
              <span class="pe-pick-k">{{ row.k }}:</span>
              <span class="pe-pick-v">{{ row.v }}</span>
            </li>
          </ul>
        </div>

    </section>
  </div>
</template>

<style scoped>
.pe {
  margin: 1.75rem 0;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: color-mix(in srgb, var(--vp-c-bg-soft), transparent 10%);
}

.pe-toolbar .pe-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: flex-start;
}
.pe-toolbar .compact {
  margin-top: 0.55rem;
}

.pe-code-col {
  min-width: 0;
  margin: 0;
  padding: 0;
  align-self: start;
}

/* Flow chart (under snippet, same column) */
.pe-flowchart {
  margin-top: 0.85rem;
  padding: 0.6rem 0.35rem 0.7rem;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: color-mix(in srgb, var(--vp-c-bg-soft), transparent 45%);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pe-flowchart-title {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--vp-c-text-3);
  margin-bottom: 0.45rem;
  width: 100%;
  text-align: center;
}
.pe-flowchart-track {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  justify-content: center;
  gap: 0.1rem 0.22rem;
  overflow-x: auto;
  padding-bottom: 0.15rem;
  scrollbar-width: thin;
  width: max-content;
  max-width: 100%;
  margin-inline: auto;
}
.fc-seg {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.2rem;
  flex: 0 0 auto;
  align-self: stretch;
  min-width: 0;
  max-width: 5.85rem;
  padding: 0 0.1rem;
}
.fc-attempt-span {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.2rem;
  flex: 0 0 auto;
  align-self: stretch;
  min-width: 0;
  max-width: 12.75rem;
  padding: 0 0.1rem;
}
.fc-attempt-cols {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  flex: 1 1 auto;
  gap: 0.48rem;
  min-height: 0;
}
.fc-subcol {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.2rem;
  flex: 1 1 0;
  min-width: 0;
  max-width: 5.85rem;
}
.fc-subcol--outcomes {
  position: relative;
  border-radius: 8px;
  transition: box-shadow 0.18s ease;
}
.fc-subcol--outcomes.fc-col--tour {
  box-shadow: 0 0 0 1px var(--vp-c-brand-1);
}
.fc-seg-body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  min-height: 0;
}
.fc-seg-label {
  flex-shrink: 0;
  display: block;
  width: 100%;
  text-align: center;
  font-family: ui-monospace, monospace;
  font-size: 0.6rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  line-height: 1.2;
  box-sizing: border-box;
  padding: 0 0.08rem 0.16rem;
  border-bottom: 2px solid color-mix(in srgb, var(--vp-c-divider), transparent 12%);
  transition:
    border-color 0.18s ease,
    color 0.18s ease;
}
.fc-seg-label--span {
  max-width: none;
}
.fc-head--tour {
  color: var(--vp-c-brand-1);
  border-bottom-color: var(--vp-c-brand-1);
}
.fc-arr {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  flex-shrink: 0;
  width: 0.85rem;
  min-width: 0.85rem;
  color: var(--vp-c-text-3);
  line-height: 1;
}
.fc-arr-glyph {
  font-size: 0.75rem;
  line-height: 1;
}
.fc-branch {
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  align-items: stretch;
}
.fc-opt {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  min-height: 2.05rem;
  padding: 0.24rem 0.35rem;
  border-radius: 7px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  font-family: ui-monospace, monospace;
  font-size: 0.72rem;
  text-align: center;
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    filter 0.15s ease,
    background-color 0.15s ease;
}
.fc-opt--on {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  font-weight: 600;
  background: color-mix(in srgb, var(--vp-c-brand-1), transparent 90%);
  opacity: 1;
  filter: none;
}
.fc-opt--off {
  opacity: 0.42;
  color: var(--vp-c-text-2);
  filter: grayscale(0.25);
}
.fc-opt--off:hover:not(:disabled) {
  opacity: 1;
  filter: none;
  border-color: color-mix(in srgb, var(--vp-c-brand-1), var(--vp-c-divider) 35%);
  color: var(--vp-c-text-1);
}
.fc-opt:disabled {
  opacity: 0.28;
  cursor: not-allowed;
  filter: grayscale(0.5);
}
.fc-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 2.05rem;
  font-family: ui-monospace, monospace;
  font-size: 0.68rem;
  padding: 0.22rem 0.32rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: color-mix(in srgb, var(--vp-c-bg-soft), transparent 30%);
  color: var(--vp-c-text-1);
  text-align: center;
  line-height: 1.2;
}
.fc-pill--static {
  cursor: default;
}
.fc-pill--pop {
  cursor: help;
}

.fc-flow-pop {
  position: fixed;
  z-index: 10000;
  transform: translate(calc(-100% - 2px), calc(-100% - 2px));
  min-width: min(100vw - 24px, 280px);
  max-width: min(100vw - 24px, 520px);
  max-height: min(52vh, 400px);
  overflow: auto;
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
  border: 1px solid rgb(148 163 184 / 0.35);
  background: var(--vp-code-block-bg, #0f172a);
  box-shadow:
    0 20px 50px rgb(0 0 0 / 0.4),
    0 0 0 1px rgb(15 23 42 / 0.6);
  pointer-events: auto;
}
.fc-flow-pop-pre {
  margin: 0;
  font-family: ui-monospace, 'JetBrains Mono', 'SFMono-Regular', Menlo, monospace;
  font-size: 0.68rem;
  line-height: 1.48;
  white-space: pre;
  overflow-wrap: normal;
  word-break: normal;
  color: #e2e8f0;
}

.pe-step-panel .pe-toolbar {
  margin: 0 0 1rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--vp-c-divider);
}
.pe-spacer {
  flex: 1;
}
.pe-btn {
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  padding: 0.45rem 0.95rem;
  background: transparent;
}
.pe-btn.primary {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.pe-btn:disabled {
  opacity: 0.45;
}
.pe-btn.ghost:hover,
.pe-btn:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
}
.pe-label {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
  font-size: 0.875rem;
}
.pe-select {
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  padding: 0.25rem 0.4rem;
}
.pe-hint {
  flex: 1;
  color: var(--vp-c-text-3);
  font-size: 0.8rem;
}

/* Illustration column (paired with snippet in `.pe-top`) */
.pe-illustration {
  margin-top: 0;
  min-width: 0;
}
.pe-illustration-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.pe-ill-label {
  font-weight: 700;
  font-size: 0.95rem;
}
.pe-ill-caption {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.pe-illustration-stack {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}

.mock-shell {
  position: relative;
  display: flex;
  min-height: 300px;
  border-radius: 16px;
  border: 1px solid var(--vp-c-divider);
  background: linear-gradient(135deg, var(--vp-c-bg), color-mix(in srgb, var(--vp-c-bg-soft), transparent 35%));
  overflow: hidden;
  box-shadow: 0 18px 48px rgb(15 23 42 / 0.08);
}
html.dark .mock-shell {
  box-shadow: 0 20px 56px rgb(0 0 0 / 0.35);
}

/* Tour cues: synthetic pointer + pulse + “click” affordances */
.mock-tour-pointer {
  position: absolute;
  z-index: 8;
  color: var(--vp-c-brand-1);
  filter: drop-shadow(0 3px 5px rgb(0 0 0 / 0.4));
  pointer-events: none;
}
.mock-tour-pointer--nav {
  animation: mock-tour-pointer-nav 2.6s ease-in-out infinite;
}
.mock-tour-pointer--attempt {
  animation: mock-tour-pointer-to-create 2.9s ease-in-out infinite;
}
.mock-shell--aim-plus .mock-tour-pointer--attempt {
  animation-name: mock-tour-pointer-to-plus;
}
.mock-tour-pointer-svg {
  display: block;
}

@keyframes mock-tour-pointer-nav {
  0% {
    left: 58%;
    top: 46%;
    opacity: 0;
    transform: scale(0.85) rotate(-6deg);
  }
  10% {
    opacity: 1;
  }
  42% {
    left: 11%;
    top: 28%;
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  48% {
    transform: scale(0.86) translateY(3px);
  }
  54% {
    transform: scale(1) translateY(0);
  }
  100% {
    left: 11%;
    top: 28%;
    opacity: 0.88;
    transform: scale(1);
  }
}

@keyframes mock-tour-pointer-to-create {
  0% {
    left: 54%;
    top: 32%;
    opacity: 0;
    transform: scale(0.88);
  }
  12% {
    opacity: 1;
  }
  46% {
    left: 22%;
    top: 58%;
    opacity: 1;
    transform: scale(1);
  }
  52% {
    transform: scale(0.84) translateY(3px);
  }
  58% {
    transform: scale(1);
  }
  100% {
    left: 22%;
    top: 58%;
    opacity: 0.9;
    transform: scale(1);
  }
}

@keyframes mock-tour-pointer-to-plus {
  0% {
    left: 48%;
    top: 36%;
    opacity: 0;
    transform: scale(0.88);
  }
  12% {
    opacity: 1;
  }
  46% {
    left: 86%;
    top: 18%;
    opacity: 1;
    transform: scale(1);
  }
  52% {
    transform: scale(0.84) translateY(2px);
  }
  58% {
    transform: scale(1);
  }
  100% {
    left: 86%;
    top: 18%;
    opacity: 0.9;
    transform: scale(1);
  }
}

.mock-tour-nav-click {
  animation: mock-tour-nav-tap 2.6s ease-in-out infinite;
}
@keyframes mock-tour-nav-tap {
  0%,
  40% {
    background: transparent;
    transform: scale(1);
  }
  48% {
    background: color-mix(in srgb, var(--vp-c-brand-1), transparent 82%);
    transform: scale(0.97);
  }
  56% {
    background: transparent;
    transform: scale(1);
  }
  100% {
    transform: scale(1);
  }
}

.mock-tour-click {
  animation: mock-tour-btn-click 2.9s ease-in-out infinite;
}
@keyframes mock-tour-btn-click {
  0%,
  44% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.94);
  }
  56% {
    transform: scale(1);
  }
  100% {
    transform: scale(1);
  }
}

.mock-timeout-countdown {
  position: absolute;
  bottom: 14px;
  left: 16px;
  z-index: 5;
  max-width: min(100%, 20rem);
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  border: 1px dashed color-mix(in srgb, var(--vp-c-brand-1), var(--vp-c-divider) 55%);
  background: color-mix(in srgb, var(--vp-c-bg-soft), transparent 25%);
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  box-shadow: 0 8px 22px rgb(15 23 42 / 0.12);
  pointer-events: none;
}
.mock-timeout-countdown-k {
  display: block;
  font-family: ui-monospace, monospace;
  font-size: 0.72rem;
  color: var(--vp-c-brand-2);
  margin-bottom: 0.2rem;
}
.mock-timeout-countdown-v {
  line-height: 1.45;
  font-variant-numeric: tabular-nums;
}

.mock-tour-pulse {
  position: relative;
  z-index: 1;
  border-radius: 10px;
  animation: mock-tour-pulse-glow 1.35s ease-in-out infinite;
}

.mock-tour-pulse--delay {
  animation-delay: 0.4s;
}

@keyframes mock-tour-pulse-glow {
  0%,
  100% {
    box-shadow:
      0 0 0 0 rgb(59 130 246 / 0.2),
      0 0 0 0 rgb(59 130 246 / 0);
  }
  50% {
    box-shadow:
      0 0 0 3px rgb(59 130 246 / 0.45),
      0 0 22px rgb(59 130 246 / 0.18);
  }
}

.mock-side {
  width: 140px;
  padding: 1rem;
  border-right: 1px solid var(--vp-c-divider);
  font-size: 0.84rem;
  position: relative;
}
.mock-brand {
  font-weight: 700;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}
.mock-nav {
  padding: 0.3rem 0;
  color: var(--vp-c-text-2);
}
.mock-nav.sel {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.mock-pill {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  font-size: 0.7rem;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

.mock-main {
  flex: 1;
  padding: 1.1rem 1.35rem;
  font-size: 0.9rem;
  position: relative;
}
.mock-placeholder {
  color: var(--vp-c-text-2);
}
.mock-placeholder p {
  font-weight: 600;
}
.mock-placeholder small {
  display: block;
  margin-top: 0.45rem;
  line-height: 1.55;
}

.mock-h {
  margin: 0 0 0.55rem;
  font-size: 1.05rem;
}
.mock-h.xl {
  font-size: 1.3rem;
}
.mock-quiet {
  margin: 0 0 0.85rem;
  color: var(--vp-c-text-2);
  font-size: 0.86rem;
}
.mock-muted {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-weight: 500;
}
html.dark .mock-muted {
  color: #94a3b8;
}

.mock-muted.mock-tour-pulse {
  display: inline-block;
  padding: 0.12rem 0.45rem;
}

.mock-primary {
  border-radius: 10px;
  border: 1px solid var(--vp-c-brand-1);
  background: transparent;
  color: var(--vp-c-brand-1);
  padding: 0.5rem 1rem;
  font-size: 0.88rem;
  cursor: default;
}
.mock-primary.ghost {
  margin-top: 1rem;
  opacity: 0.9;
}
.mock-primary--hit {
  cursor: default;
}

.mock-table {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.55);
}
html.dark .mock-table {
  background: rgba(0, 0, 0, 0.38);
}

.mock-th,
.mock-tr {
  display: grid;
  grid-template-columns: minmax(0, 2fr) 1fr 44px;
  gap: 0.5rem;
  padding: 0.48rem 0.7rem;
  font-size: 0.82rem;
  align-items: center;
}
.mock-th {
  background: rgba(15, 23, 42, 0.05);
  font-weight: 600;
}
html.dark .mock-th {
  background: rgba(255, 255, 255, 0.05);
}
.mock-tr + .mock-tr {
  border-top: 1px solid var(--vp-c-divider);
}

.mock-table--4 .mock-th,
.mock-table--4 .mock-tr {
  grid-template-columns: minmax(0, 2fr) 1fr 44px 40px;
}
.mock-th-action,
.mock-td-action {
  display: flex;
  justify-content: center;
  align-items: center;
}
.mock-icon-add {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1), transparent 92%);
  color: var(--vp-c-brand-1);
  font-size: 1.15rem;
  line-height: 1;
  cursor: default;
  padding: 0;
}

.mock-caption {
  display: block;
  margin-top: 1rem;
  color: var(--vp-c-text-3);
  font-size: 0.78rem;
}

.mock-toast--float {
  position: absolute;
  top: 16px;
  right: 18px;
  z-index: 4;
  background: rgb(239 68 68 / 0.16);
  color: rgb(248 113 113);
  border-radius: 10px;
  padding: 0.5rem 1rem;
  font-size: 0.78rem;
  box-shadow:
    0 10px 28px rgb(15 23 42 / 0.18),
    0 0 0 1px rgb(239 68 68 / 0.28);
  pointer-events: none;
}

.muted {
  color: var(--vp-c-text-2);
}

/* ── Row 1: snippet + illustration ───────────────────────────────── */
.pe-top {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(260px, 1fr);
  gap: clamp(14px, 2.2vw, 28px);
  align-items: start;
}

.pe-top > * {
  margin-top: 0;
  padding-top: 0;
}

@media (max-width: 960px) {
  .pe-top {
    grid-template-columns: 1fr;
  }
}

/* ── Row 2: full-width tour ──────────────────────────────────────── */
.pe-tour {
  margin-top: 1.35rem;
  padding-top: 1.2rem;
  border-top: 1px solid var(--vp-c-divider);
}

.pe-tour.pe-step-panel {
  padding-left: 0;
  align-self: stretch;
}

/* Smart-table–style code shell */
.pe-code-wrap {
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  overflow: hidden;
  background: var(--vp-code-block-bg, #0f172a);
  box-shadow: 0 24px 70px rgb(15 23 42 / 0.14);
}
html.dark .pe-code-wrap {
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.38);
}

.pe-code-lang {
  padding: 0.45rem 1rem;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(148 163 184 / 0.95);
  border-bottom: 1px solid rgb(148 163 184 / 0.15);
  background: rgb(15 23 42 / 0.55);
}

.pe-top .pe-code-pre {
  max-height: min(440px, 52vh);
}

.pe-code-pre {
  margin: 0;
  padding: 1rem 0.75rem 1rem 0.35rem;
  max-height: 520px;
  overflow-x: hidden;
  overflow-y: auto;
  font-family:
    ui-monospace,
    'JetBrains Mono',
    'SFMono-Regular',
    Menlo,
    Monaco,
    Consolas,
    monospace;
  font-size: 0.8rem;
  line-height: 1.55;
  color: #e2e8f0;
}

.pe-line {
  display: block;
  padding: 0.08rem 0.35rem 0.08rem 0;
  border-radius: 6px;
}

.pe-line:not(.pe-line-hidden) {
  transition:
    opacity 0.32s ease,
    filter 0.32s ease,
    background-color 0.32s ease,
    box-shadow 0.32s ease;
}

.pe-line-hidden {
  display: none !important;
}

.pe-code-pre--focus .pe-line-hi {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 0.5rem;
  background: rgb(59 130 246 / 0.2);
  box-shadow: inset 3px 0 0 0 rgb(96 165 250 / 0.95);
}

.pe-code-pre--focus .pe-line-hi .pe-ln {
  flex: 0 0 auto;
  margin-right: 0;
}

.pe-code-pre--focus .pe-line-hi .pe-lc-code {
  flex: 1 1 0;
  min-width: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.pe-code-pre--focus .pe-line-collapsed {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 0.5rem;
  opacity: 0.48;
  filter: grayscale(0.2);
}

.pe-code-pre--focus .pe-line-collapsed .pe-ln {
  flex: 0 0 auto;
  margin-right: 0;
}

.pe-lc-collapsed {
  flex: 1 1 0;
  min-width: 0;
  font-style: italic;
  color: rgb(148 163 184 / 0.92);
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.45;
}

/* Overview / no highlight: wrap long lines, no horizontal scroll */
.pe-code-pre:not(.pe-code-pre--focus) .pe-line {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 0.5rem;
}

.pe-code-pre:not(.pe-code-pre--focus) .pe-line-hi {
  background: rgb(59 130 246 / 0.18);
  box-shadow: inset 3px 0 0 0 rgb(96 165 250 / 0.95);
}

.pe-code-pre:not(.pe-code-pre--focus) .pe-line .pe-ln {
  flex: 0 0 auto;
  margin-right: 0;
}

.pe-code-pre:not(.pe-code-pre--focus) .pe-lc-code {
  flex: 1 1 0;
  min-width: 0;
}

.pe-ln {
  display: inline-block;
  width: 2.6rem;
  margin-right: 0.75rem;
  text-align: right;
  user-select: none;
  color: rgb(100 116 139 / 0.85);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.pe-lc-code {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

@media (prefers-reduced-motion: reduce) {
  .pe-line {
    transition: none;
  }
  .mock-tour-pointer,
  .mock-tour-pulse,
  .mock-tour-nav-click,
  .mock-tour-click {
    animation: none !important;
  }
  .mock-tour-pulse {
    box-shadow: 0 0 0 2px rgb(59 130 246 / 0.38);
  }
  .mock-tour-pointer--nav {
    left: 11%;
    top: 28%;
    opacity: 0.92;
  }
}

/* Token colors (dark block) */
.tok-kw {
  color: #c084fc;
  font-weight: 500;
}
.tok-type {
  color: #7dd3fc;
}
.tok-id {
  color: #e2e8f0;
}
.tok-str {
  color: #86efac;
}
.tok-num {
  color: #fcd34d;
}
.tok-cmt {
  color: rgb(148 163 184 / 0.75);
  font-style: italic;
}
.tok-punct {
  color: rgb(203 213 225 / 0.85);
}

/* Step panel — flush top with code column (avoid prose `aside` margins) */
.pe-step-panel {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0 0 0.35rem 0.5rem;
  min-width: 0;
  align-self: start;
}

.pe-step-panel :where(button, select) {
  margin-block: 0;
  vertical-align: middle;
}
.eyebrow {
  font-family: ui-monospace, monospace;
  font-size: 0.78rem;
  color: var(--vp-c-brand-2);
  margin: 0 0 0.35rem;
}
.pe-step-title {
  margin: 0 0 0.4rem;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}
.pe-step-hint {
  margin: 0 0 0.85rem;
  color: var(--vp-c-text-2);
  line-height: 1.55;
  font-size: 0.92rem;
}

.pe-bullets {
  margin: 0 0 1rem;
  padding-left: 1.15rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.6;
}
.pe-pick-k {
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-right: 0.35rem;
}
.pe-pick-v {
  color: var(--vp-c-text-2);
}

.pe-options-title {
  font-weight: 600;
  margin: 0 0 0.5rem;
  font-size: 0.88rem;
}
.pe-option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.65rem;
}
.pe-opt {
  text-align: left;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  padding: 0.75rem 0.85rem;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}
.pe-opt:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 8px 22px rgb(15 23 42 / 0.08);
}
.pe-opt:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}
.pe-opt-k {
  display: block;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  margin-bottom: 0.25rem;
  font-size: 0.88rem;
}
.pe-opt-d {
  display: block;
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
  line-height: 1.45;
}

.pe-picks {
  margin-top: 1.1rem;
  padding: 0.75rem 0.85rem;
  border-radius: 12px;
  border: 1px dashed var(--vp-c-divider);
  background: color-mix(in srgb, var(--vp-c-bg-soft), transparent 20%);
}
.pe-picks-title {
  margin: 0 0 0.35rem;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3);
}
.pe-picks-list {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.84rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.edit-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}
.pe-linkbtn {
  border: none;
  padding: 0;
  font-size: 0.82rem;
  background: transparent;
  text-decoration: underline;
  cursor: pointer;
  color: var(--vp-c-brand-1);
}
</style>
