/**
 * The error thrown when a cron expression cannot be parsed.
 *
 * The `field` property names the offending field (or `null` when the
 * expression itself is malformed), and `segment` contains the exact
 * token that caused the failure.
 */
export class CronParseError extends Error {
  /** The cron field the error relates to, if any. */
  readonly field: string | null;

  /** The exact token that caused the error, if any. */
  readonly segment: string | null;

  constructor(message: string, field: string | null = null, segment: string | null = null) {
    super(message);
    this.name = 'CronParseError';
    this.field = field;
    this.segment = segment;
  }
}
