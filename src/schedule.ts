import type { ParsedCron } from './types.js';

/** How far forward and backward the scheduler searches before giving up. */
const SEARCH_WINDOW_YEARS = 4;

function dayMatches(date: Date, cron: ParsedCron): boolean {
  const domOk = cron.dayOfMonth.restricted ? cron.dayOfMonth.values.has(date.getDate()) : true;
  const dowOk = cron.dayOfWeek.restricted ? cron.dayOfWeek.values.has(date.getDay()) : true;
  // POSIX: when both day fields are restricted, a day matching either one fires.
  if (cron.dayOfMonth.restricted && cron.dayOfWeek.restricted) {
    return domOk || dowOk;
  }
  return domOk && dowOk;
}

function firstMinuteAtOrAfter(values: ReadonlySet<number>, from: number): number | null {
  for (let minute = from; minute <= 59; minute++) {
    if (values.has(minute)) return minute;
  }
  return null;
}

function lastMinuteAtOrBefore(values: ReadonlySet<number>, from: number): number | null {
  for (let minute = from; minute >= 0; minute--) {
    if (values.has(minute)) return minute;
  }
  return null;
}

/**
 * Find the first run strictly after `from`.
 *
 * The search looks at most four years ahead (enough to cover any
 * calendar-day match, including February 29th) and returns `null` when
 * no run exists in that window â for example `0 0 31 2 *` (February
 * 31st, which never exists).
 *
 * Runs are computed in the timezone of the given `Date`, as reported
 * by its local getters.
 */
export function nextCronRun(cron: ParsedCron, from: Date = new Date()): Date | null {
  let cursor = new Date(from.getTime() + 60_000);
  cursor.setSeconds(0, 0);
  const limit = new Date(from.getTime());
  limit.setFullYear(limit.getFullYear() + SEARCH_WINDOW_YEARS);
  while (cursor.getTime() <= limit.getTime()) {
    if (!cron.month.values.has(cursor.getMonth() + 1)) {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      continue;
    }
    if (!dayMatches(cursor, cron)) {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
      continue;
    }
    if (!cron.hour.values.has(cursor.getHours())) {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), cursor.getHours() + 1);
      continue;
    }
    const minute = firstMinuteAtOrAfter(cron.minute.values, cursor.getMinutes());
    if (minute !== null) {
      return new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), cursor.getHours(), minute);
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), cursor.getHours() + 1);
  }
  return null;
}

/**
 * Find the last run strictly before `from`.
 *
 * Mirrors `nextCronRun`: searches at most four years back and
 * returns `null` when no run exists in that window.
 */
export function previousCronRun(cron: ParsedCron, from: Date = new Date()): Date | null {
  let cursor = new Date(from.getTime() - 60_000);
  cursor.setSeconds(0, 0);
  const limit = new Date(from.getTime());
  limit.setFullYear(limit.getFullYear() - SEARCH_WINDOW_YEARS);
  while (cursor.getTime() >= limit.getTime()) {
    if (!cron.month.values.has(cursor.getMonth() + 1)) {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 0, 23, 59);
      continue;
    }
    if (!dayMatches(cursor, cron)) {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1, 23, 59);
      continue;
    }
    if (!cron.hour.values.has(cursor.getHours())) {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), cursor.getHours() - 1, 59);
      continue;
    }
    const minute = lastMinuteAtOrBefore(cron.minute.values, cursor.getMinutes());
    if (minute !== null) {
      return new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), cursor.getHours(), minute);
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), cursor.getHours() - 1, 59);
  }
  return null;
}

/**
 * List the first `count` runs at or after `from`.
 *
 * Returns fewer than `count` runs when the expression cannot fire
 * that many times within the four-year search window.
 *
 * @throws {RangeError} when `count` is not a positive integer.
 */
export function nextCronRuns(cron: ParsedCron, from: Date, count: number): Date[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError('count must be a positive integer');
  }
  const runs: Date[] = [];
  let cursor = new Date(from.getTime());
  for (let i = 0; i < count; i++) {
    const run = nextCronRun(cron, cursor);
    if (run === null) break;
    runs.push(run);
    cursor = run;
  }
  return runs;
}
