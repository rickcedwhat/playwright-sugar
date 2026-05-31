export const playwrightDts = `
declare module '@playwright/test' {
  export interface Locator {
    click(options?: { timeout?: number; force?: boolean; noWaitAfter?: boolean }): Promise<void>;
    fill(value: string, options?: { timeout?: number; force?: boolean }): Promise<void>;
    clear(options?: { timeout?: number; force?: boolean }): Promise<void>;
    hover(options?: { timeout?: number; force?: boolean }): Promise<void>;
    waitFor(options?: { state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number }): Promise<void>;
    isVisible(options?: { timeout?: number }): Promise<boolean>;
    first(): Locator;
    last(): Locator;
    nth(index: number): Locator;
    locator(selector: string): Locator;
    getByRole(role: string, options?: { name?: string | RegExp; exact?: boolean }): Locator;
    getByText(text: string | RegExp, options?: { exact?: boolean }): Locator;
    getByPlaceholder(text: string | RegExp, options?: { exact?: boolean }): Locator;
    getByLabel(text: string | RegExp, options?: { exact?: boolean }): Locator;
    filter(options?: { has?: Locator; hasNot?: Locator; hasText?: string | RegExp }): Locator;
  }

  export interface Page {
    locator(selector: string): Locator;
    getByRole(role: string, options?: { name?: string | RegExp; exact?: boolean }): Locator;
    getByText(text: string | RegExp, options?: { exact?: boolean }): Locator;
    getByPlaceholder(text: string | RegExp, options?: { exact?: boolean }): Locator;
    getByLabel(text: string | RegExp, options?: { exact?: boolean }): Locator;
    click(selector: string, options?: { timeout?: number }): Promise<void>;
    fill(selector: string, value: string, options?: { timeout?: number }): Promise<void>;
    waitForTimeout(timeout: number): Promise<void>;
    keyboard: {
      press(key: string, options?: { delay?: number }): Promise<void>;
    };
    url(): string;
    reload(options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeout?: number }): Promise<void>;
  }
}
`;

export const playwrightSugarDts = `
declare module '@rickcedwhat/playwright-sugar' {
  import { Page, Locator } from '@playwright/test';

  export interface PlayOutcome {
    name: string;
    isSuccess: boolean;
    locator?: Locator;
    payload?: any;
  }

  export type LocatorArg = Locator | ((page: Page, ctx: Record<string, any>) => Locator | Promise<Locator>);

  export interface OutcomeSpec {
    name: string;
    isSuccess: boolean;
    locator?: LocatorArg;
    isTimeoutOutcome?: boolean;
    isActionErrorOutcome?: boolean;
    onOutcome?: (winner: Locator) => Promise<any>;
  }

  export const Outcomes: {
    success(locator: LocatorArg): OutcomeSpec;
    success(name: string, locator: LocatorArg, opts?: { onOutcome?: (winner: Locator) => Promise<any> }): OutcomeSpec;
    failure(locator: LocatorArg): OutcomeSpec;
    failure(name: string, locator: LocatorArg, opts?: { onOutcome?: (winner: Locator) => Promise<any> }): OutcomeSpec;
    timeout(name?: string, opts?: { isSuccess?: boolean }): OutcomeSpec;
    actionError(name?: string): OutcomeSpec;
  };

  export interface PlayHistory {
    lastOutcome?: PlayOutcome;
    steps: Record<string, PlayOutcome>;
  }

  export interface PlayCtx {
    [key: string]: any;
  }

  export type ActFn = (page: Page, ctx: PlayCtx, history: PlayHistory) => Promise<void>;

  export interface ActOptions {
    skip?: boolean | ((ctx: PlayCtx, history: PlayHistory) => boolean);
  }

  export interface DetectOptions extends ActOptions {
    timeout?: number;
    ambiguityBufferMs?: number;
  }

  export interface DetectCandidate {
    name: string;
    isSuccess: boolean;
    locator?: Locator | (() => Promise<Locator | null>);
    isTimeoutOutcome?: boolean;
    isActionErrorOutcome?: boolean;
    onOutcome?: (winner: Locator) => Promise<any>;
  }

  export class Play {
    act(name: string, fn: ActFn, opts?: ActOptions): Play;
    nav(fn: ActFn, opts?: ActOptions): Play;
    nav(name: string, fn: ActFn, opts?: ActOptions): Play;
    prep(fn: ActFn, opts?: ActOptions): Play;
    prep(name: string, fn: ActFn, opts?: ActOptions): Play;
    attempt(name: string, action: ActFn, outcomes: any[], opts?: any): Play;
    cleanup(fn: ActFn, opts?: ActOptions): Play;
    cleanup(name: string, fn: ActFn, opts?: ActOptions): Play;
    detect(fn: (page: Page) => DetectCandidate[], opts?: DetectOptions): Play;
    detect(name: string, fn: (page: Page) => DetectCandidate[], opts?: DetectOptions): Play;
  }

  export class Playbook<P> {
    constructor(name: string, plays: P);
  }

  export function clickToOpen(trigger: Locator, target: Locator, opts?: any): Promise<void>;
}

declare function clickTab(page: any, tabName: string, options?: any): Promise<void>;
declare function getBraintrustTable(page: any): any;
declare function openOrgProjectsListPage(page: any): Promise<void>;
declare function getProjectMenuHelpers(page: any): any;
declare function getSelectedProjectName(page: any): Promise<string>;
declare function findInVirtualList(page: any, itemText: string): Promise<any>;
declare const ToastOutcomes: any;
`;
