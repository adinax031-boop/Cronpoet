/**
 * cronpoet â cron expressions, in plain English.
 *
 * A zero-dependency library to parse, validate, describe and schedule
 * five-field cron expressions.
 *
 * @packageDocumentation
 */

import { describeParsed } from './describe.js';
import { parseCron } from './parser.js';
import { nextCronRun, nextCronRuns, previousCronRun } from './schedule.js';
import type { CronMacro, DescribeOptions, ParsedCron } from './types.js';

export { CronParseError } from './errors.js';
export { parseCron } from './parser.js';
export { describeCron, describeParsed } from './describe.js';
export { nextCronRun, nextCronRuns, previousCronRun } from './schedule.js';
export type {
  CronField,
  CronFieldName,
  CronMacro,
  CronSegment,
  DescribeOptions,
  ParsedCron,
} from './types.js';

/**
 * A parsed, validated cron expression with an object-oriented API.
 *
 * @example
 * ```ts
 * const schedule = CronExpression.parse('30 8 * * 1-5');
 *
 * schedule.describe();                    // "At 08:30, on Monday through Friday."
 * schedule.next();                        // the next weekday run, as a Date
 * schedule.previous(new Date('2026-01-02T07:00:00Z'));
 * schedule.nextRuns(new Date('2026-01-01'), 3);
 * ```
 */
export class CronExpression {
  /** The expression as written, trimmed. */
  readonly source: string;

  /** The macro this expression was written with, or `null`. */
  readonly macro: CronMacro | null;

  /** The parsed field structure of the expression. */
  readonly fields: ParsedCron;

  private constructor(fields: ParsedCron) {
    this.source = fields.source;
    this.macro = fields.macro;
    this.fields = fields;
  }

  /**
   * Parse and validate a cron expression.
   *
   * @throws {import('./errors.js').CronParseError} if the expression is invalid.
   */
  static parse(expression: string): CronExpression {
    return new CronExpression(parseCron(expression));
  }

  /** Describe this expression in plain English. */
  describe(options?: DescribeOptions): string {
    return describeParsed(this.fields, options);
  }

  /** The first run strictly after `from` (default: now), or `null`. */
  next(from: Date = new Date()): Date | null {
    return nextCronRun(this.fields, from);
  }

  /** The last run strictly before `from` (default: now), or `null`. */
  previous(from: Date = new Date()): Date | null {
    return previousCronRun(this.fields, from);
  }

  /**
   * The first `count` runs at or after `from`.
   *
   * @throws {RangeError} when `count` is not a positive integer.
   */
  nextRuns(from: Date, count: number): Date[] {
    return nextCronRuns(this.fields, from, count);
  }
}
