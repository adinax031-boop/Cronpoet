import { describe, expect, it } from 'vitest';
import { CronExpression, nextCronRun, nextCronRuns, parseCron, previousCronRun } from '../src/index.js';

describe('scheduling', () => {
  it('finds the next and previous run of a step pattern', () => {
    const cron = parseCron('*/15 * * * *');
    const from = new Date(2026, 0, 1, 10, 7);
    expect(nextCronRun(cron, from)).toEqual(new Date(2026, 0, 1, 10, 15));
    expect(previousCronRun(cron, from)).toEqual(new Date(2026, 0, 1, 10, 0));
  });

  it('skips weekends for weekday schedules', () => {
    const cron = parseCron('30 8 * * 1-5');
    // January 2nd 2026 is a Friday.
    expect(nextCronRun(cron, new Date(2026, 0, 2, 9, 0))).toEqual(new Date(2026, 0, 5, 8, 30));
    expect(previousCronRun(cron, new Date(2026, 0, 2, 7, 0))).toEqual(new Date(2026, 0, 1, 8, 30));
  });

  it('searches across years for yearly schedules', () => {
    const cron = parseCron('0 0 1 1 *');
    expect(nextCronRun(cron, new Date(2026, 5, 1))).toEqual(new Date(2027, 0, 1));
    expect(previousCronRun(cron, new Date(2026, 5, 1))).toEqual(new Date(2026, 0, 1));
  });

  it('applies POSIX OR semantics when both day fields are restricted', () => {
    const cron = parseCron('0 12 1 * 0');
    // January 1st 2026 is a Thursday.
    expect(nextCronRun(cron, new Date(2026, 0, 1, 0, 0))).toEqual(new Date(2026, 0, 1, 12, 0));
    expect(nextCronRun(cron, new Date(2026, 0, 2, 0, 0))).toEqual(new Date(2026, 0, 4, 12, 0));
    expect(previousCronRun(cron, new Date(2026, 0, 5, 0, 0))).toEqual(new Date(2026, 0, 4, 12, 0));
  });

  it('returns null for expressions that can never fire', () => {
    const cron = parseCron('0 0 31 2 *');
    expect(nextCronRun(cron, new Date(2026, 0, 1))).toBeNull();
    expect(previousCronRun(cron, new Date(2026, 0, 1))).toBeNull();
  });

  it('finds leap-day schedules inside the four-year search window', () => {
    const cron = parseCron('0 0 29 2 *');
    expect(nextCronRun(cron, new Date(2026, 0, 1))).toEqual(new Date(2028, 1, 29));
  });

  it('lists consecutive runs', () => {
    const cron = parseCron('0 0 * * 0');
    expect(nextCronRuns(cron, new Date(2026, 0, 1), 3)).toEqual([
      new Date(2026, 0, 4),
      new Date(2026, 0, 11),
      new Date(2026, 0, 18),
    ]);
  });

  it('returns runs strictly after (next) and strictly before (previous)', () => {
    const cron = parseCron('0 12 * * *');
    expect(nextCronRun(cron, new Date(2026, 0, 1, 12, 0))).toEqual(new Date(2026, 0, 2, 12, 0));
    expect(previousCronRun(cron, new Date(2026, 0, 1, 12, 0))).toEqual(new Date(2025, 11, 31, 12, 0));
  });

  it('truncates sub-minute precision and crosses year boundaries', () => {
    const cron = parseCron('15 0 1 1 *');
    expect(nextCronRun(cron, new Date(2026, 11, 31, 23, 59, 30))).toEqual(new Date(2027, 0, 1, 0, 15));
  });

  it('rejects invalid run counts', () => {
    const cron = parseCron('0 0 * * *');
    expect(() => nextCronRuns(cron, new Date(2026, 0, 1), 0)).toThrow(RangeError);
  });
});

describe('CronExpression', () => {
  const schedule = CronExpression.parse('30 8 * * 1-5');

  it('describes itself', () => {
    expect(schedule.describe()).toBe('At 08:30, on Monday through Friday.');
  });

  it('exposes its source and fields', () => {
    expect(schedule.source).toBe('30 8 * * 1-5');
    expect([...schedule.fields.minute.values]).toEqual([30]);
  });

  it('schedules through its methods', () => {
    expect(schedule.next(new Date(2026, 0, 2, 9, 0))).toEqual(new Date(2026, 0, 5, 8, 30));
    expect(schedule.previous(new Date(2026, 0, 2, 7, 0))).toEqual(new Date(2026, 0, 1, 8, 30));
    expect(schedule.nextRuns(new Date(2026, 0, 1), 3)).toEqual([
      new Date(2026, 0, 1, 8, 30),
      new Date(2026, 0, 2, 8, 30),
      new Date(2026, 0, 5, 8, 30),
    ]);
  });

  it('records macros', () => {
    expect(CronExpression.parse('@hourly').macro).toBe('@hourly');
  });
});
