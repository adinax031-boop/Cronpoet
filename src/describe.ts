import { parseCron } from './parser.js';
import type { CronField, DescribeOptions, ParsedCron } from './types.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const pad2 = (value: number): string => String(value).padStart(2, '0');

function joinAnd(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function sortedValues(field: CronField): number[] {
  return [...field.values].sort((a, b) => a - b);
}

function singleValue(field: CronField): number | null {
  return field.values.size === 1 ? sortedValues(field)[0] : null;
}

function contiguousRange(field: CronField): { from: number; to: number } | null {
  if (field.segments.length === 1) {
    const segment = field.segments[0];
    if (segment.step === null && segment.from < segment.to) {
      return { from: segment.from, to: segment.to };
    }
  }
  return null;
}

function stepPattern(field: CronField): { from: number; by: number } | null {
  if (field.segments.length === 1) {
    const segment = field.segments[0];
    if (segment.step !== null && segment.to === field.max) {
      return { from: segment.from, by: segment.step };
    }
  }
  return null;
}

function minuteList(field: CronField): string {
  const parts: string[] = [];
  for (const segment of field.segments) {
    if (segment.step === null && segment.from === segment.to) {
      parts.push(pad2(segment.from));
    } else if (segment.step === null) {
      parts.push(`${pad2(segment.from)} through ${pad2(segment.to)}`);
    } else {
      parts.push(`${pad2(segment.from)} through ${pad2(segment.to)} every ${segment.step}`);
    }
  }
  return joinAnd(parts);
}

function hourWindow(field: CronField): string {
  const single = singleValue(field);
  if (single !== null) {
    return `from ${pad2(single)}:00 to ${pad2(single)}:59`;
  }
  const range = contiguousRange(field);
  if (range) {
    return `from ${pad2(range.from)}:00 to ${pad2(range.to)}:59`;
  }
  const step = stepPattern(field);
  if (step) {
    return step.from === field.min
      ? `every ${step.by} hours`
      : `every ${step.by} hours, starting at hour ${pad2(step.from)}`;
  }
  return `past hours ${joinAnd(sortedValues(field).map(pad2))}`;
}

function timeClause(minute: CronField, hour: CronField): string {
  const minSingle = singleValue(minute);
  const hourSingle = singleValue(hour);
  if (minSingle !== null && hourSingle !== null) {
    return `At ${pad2(hourSingle)}:${pad2(minSingle)}`;
  }
  if (!minute.restricted && !hour.restricted) {
    return 'Every minute';
  }
  if (!hour.restricted) {
    const step = stepPattern(minute);
    if (step) {
      return step.from === minute.min
        ? `Every ${step.by} minutes`
        : `Every ${step.by} minutes, starting at minute ${pad2(step.from)}`;
    }
    return `At minute ${minuteList(minute)} past every hour`;
  }
  if (!minute.restricted) {
    return `Every minute, ${hourWindow(hour)}`;
  }
  const step = stepPattern(minute);
  if (step) {
    const base =
      step.from === minute.min
        ? `Every ${step.by} minutes`
        : `Every ${step.by} minutes, starting at minute ${pad2(step.from)}`;
    return `${base}, ${hourWindow(hour)}`;
  }
  if (minSingle !== null) {
    return `At minute ${pad2(minSingle)}, ${hourWindow(hour)}`;
  }
  return `At minute ${minuteList(minute)}, ${hourWindow(hour)}`;
}

function dayOfMonthClause(field: CronField): string | null {
  if (!field.restricted) return null;
  const single = singleValue(field);
  if (single !== null) {
    return `on day ${single} of the month`;
  }
  const range = contiguousRange(field);
  if (range) {
    return `on days ${range.from} through ${range.to} of the month`;
  }
  return `on days ${joinAnd(sortedValues(field).map(String))} of the month`;
}

function dayOfWeekClause(field: CronField): string | null {
  if (!field.restricted) return null;
  const single = singleValue(field);
  if (single !== null) {
    return `on ${DAY_NAMES[single]}`;
  }
  const range = contiguousRange(field);
  if (range) {
    return `on ${DAY_NAMES[range.from]} through ${DAY_NAMES[range.to]}`;
  }
  return `on ${joinAnd(sortedValues(field).map((value) => DAY_NAMES[value]))}`;
}

function monthClause(field: CronField): string | null {
  if (!field.restricted) return null;
  const single = singleValue(field);
  if (single !== null) {
    return `in ${MONTH_NAMES[single - 1]}`;
  }
  const range = contiguousRange(field);
  if (range) {
    return `during ${MONTH_NAMES[range.from - 1]} through ${MONTH_NAMES[range.to - 1]}`;
  }
  return `in ${joinAnd(sortedValues(field).map((value) => MONTH_NAMES[value - 1]))}`;
}

/**
 * Describe an already-parsed cron expression in plain English.
 *
 * @example
 * ```ts
 * describeParsed(parseCron('30 8 * * 1-5'))
 * // â "At 08:30, on Monday through Friday."
 * ```
 */
export function describeParsed(cron: ParsedCron, options: DescribeOptions = {}): string {
  const { capital = true, period = true } = options;
  const time = timeClause(cron.minute, cron.hour);
  const dom = dayOfMonthClause(cron.dayOfMonth);
  const dow = dayOfWeekClause(cron.dayOfWeek);
  let day: string | null;
  if (dom !== null && dow !== null) {
    // POSIX: when both day fields are restricted, either may match.
    day = `${dom} or ${dow}`;
  } else {
    day = dom ?? dow;
  }
  if (day === null && time.startsWith('At ')) {
    day = 'every day';
  }
  const clauses = [time, day, monthClause(cron.month)].filter(
    (clause): clause is string => clause !== null,
  );
  let sentence = clauses.join(', ');
  if (capital) {
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }
  if (period && !sentence.endsWith('.')) {
    sentence += '.';
  }
  return sentence;
}

/**
 * Parse a cron expression and describe it in plain English.
 *
 * @example
 * ```ts
 * describeCron('0 12 1 * 0')
 * // â "At 12:00, on day 1 of the month or on Sunday."
 * ```
 *
 * @throws {import('./errors.js').CronParseError} if the expression is invalid.
 */
export function describeCron(expression: string, options?: DescribeOptions): string {
  return describeParsed(parseCron(expression), options);
}
