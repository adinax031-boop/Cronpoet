import { describe, expect, it } from 'vitest';
import { CronParseError, parseCron } from '../src/index.js';

describe('parseCron', () => {
  it('parses the five classic fields', () => {
    const cron = parseCron('30 8 * * 1-5');
    expect([...cron.minute.values]).toEqual([30]);
    expect([...cron.hour.values]).toEqual([8]);
    expect(cron.dayOfMonth.restricted).toBe(false);
    expect(cron.month.restricted).toBe(false);
    expect([...cron.dayOfWeek.values]).toEqual([1, 2, 3, 4, 5]);
    expect(cron.source).toBe('30 8 * * 1-5');
    expect(cron.macro).toBeNull();
  });

  it('expands ranges, steps and lists', () => {
    const cron = parseCron('*/15 0-23/2 1,15 * *');
    expect([...cron.minute.values]).toEqual([0, 15, 30, 45]);
    expect([...cron.hour.values]).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]);
    expect([...cron.dayOfMonth.values]).toEqual([1, 15]);
  });

  it('accepts month and weekday names, case-insensitively', () => {
    const cron = parseCron('0 0 1 JAN-MAR sun,MON');
    expect([...cron.month.values]).toEqual([1, 2, 3]);
    expect([...cron.dayOfWeek.values]).toEqual([0, 1]);
  });

  it('treats 7 as Sunday in the day-of-week field', () => {
    const cron = parseCron('0 0 * * 7');
    expect([...cron.dayOfWeek.values]).toEqual([0]);
  });

  it('extends a lone stepped value to the end of the field', () => {
    const cron = parseCron('5/15 * * * *');
    expect([...cron.minute.values]).toEqual([5, 20, 35, 50]);
  });

  it('expands macros', () => {
    const cron = parseCron('@weekly');
    expect(cron.macro).toBe('@weekly');
    expect([...cron.dayOfWeek.values]).toEqual([0]);
  });

  it('accepts ? in the day fields', () => {
    expect(parseCron('0 0 ? * 1').dayOfMonth.restricted).toBe(false);
    expect(parseCron('0 0 1 * ?').dayOfWeek.restricted).toBe(false);
  });

  it('rejects six-field expressions', () => {
    expect(() => parseCron('* * * * * *')).toThrow(CronParseError);
    expect(() => parseCron('* * * * * *')).toThrow(/5-field/);
  });

  it('rejects out-of-range values', () => {
    expect(() => parseCron('60 * * * *')).toThrow(CronParseError);
    expect(() => parseCron('0 25 * * *')).toThrow(CronParseError);
    expect(() => parseCron('0 0 32 * *')).toThrow(CronParseError);
    expect(() => parseCron('0 0 * 13 *')).toThrow(CronParseError);
  });

  it('rejects inverted ranges', () => {
    expect(() => parseCron('50-10 * * * *')).toThrow(/inverted/);
  });

  it('rejects steps smaller than one', () => {
    expect(() => parseCron('*/0 * * * *')).toThrow(/at least 1/);
  });

  it('rejects ? outside the day fields', () => {
    expect(() => parseCron('? * * * *')).toThrow(/only allowed/);
  });

  it('rejects empty list items', () => {
    expect(() => parseCron('1,,2 * * * *')).toThrow(/empty item/);
  });

  it('rejects unknown macros', () => {
    expect(() => parseCron('@frequently')).toThrow(/Unknown macro/);
  });

  it('rejects expressions with the wrong number of fields', () => {
    expect(() => parseCron('99 * * *')).toThrow(/Expected 5 fields/);
  });

  it('rejects unknown values', () => {
    expect(() => parseCron('0 0 * * FOO')).toThrow(/not a valid/);
  });

  it('rejects empty expressions', () => {
    expect(() => parseCron('')).toThrow(/empty/);
  });

  it('attaches field and segment information to errors', () => {
    try {
      parseCron('0 0 32 * *');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(CronParseError);
      const parseError = error as CronParseError;
      expect(parseError.field).toBe('dayOfMonth');
      expect(parseError.segment).toBe('32');
    }
  });
});
