/** The five fields of a cron expression, in order. */
export type CronFieldName = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

/** A single `from-to/step` component of a field, e.g. `10-50/5`. */
export interface CronSegment {
  /** First value the segment matches (inclusive). */
  readonly from: number;
  /** Last value the segment matches (inclusive). */
  readonly to: number;
  /** The step written in the expression, or `null` when there is none. */
  readonly step: number | null;
}

/** A parsed cron field. */
export interface CronField {
  /** The field this object represents. */
  readonly name: CronFieldName;
  /** The smallest valid value for this field. */
  readonly min: number;
  /** The largest valid value for this field. */
  readonly max: number;
  /** Every value the field matches, fully expanded. */
  readonly values: ReadonlySet<number>;
  /** The segments exactly as written in the expression. */
  readonly segments: readonly CronSegment[];
  /** `true` when the field does not match every value it could. */
  readonly restricted: boolean;
}

/** The macros cronpoet understands, e.g. `@daily`. */
export type CronMacro =
  | '@yearly'
  | '@annually'
  | '@monthly'
  | '@weekly'
  | '@daily'
  | '@midnight'
  | '@hourly';

/** A validated cron expression. */
export interface ParsedCron {
  /** The expression as written, trimmed. */
  readonly source: string;
  /** The macro this expression was written with, or `null`. */
  readonly macro: CronMacro | null;
  /** The minute field (0â59). */
  readonly minute: CronField;
  /** The hour field (0â23). */
  readonly hour: CronField;
  /** The day-of-month field (1â31). */
  readonly dayOfMonth: CronField;
  /** The month field (1â12). */
  readonly month: CronField;
  /** The day-of-week field (0â6, Sunday is 0). */
  readonly dayOfWeek: CronField;
}

/** Formatting options for `describeCron`. */
export interface DescribeOptions {
  /** Capitalize the first letter of the sentence (default `true`). */
  readonly capital?: boolean;
  /** End the sentence with a period (default `true`). */
  readonly period?: boolean;
}
