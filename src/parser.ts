import { CronParseError } from './errors.js';
import type { CronField, CronFieldName, CronMacro, CronSegment, ParsedCron } from './types.js';

interface FieldDef {
  readonly name: CronFieldName;
  readonly min: number;
  readonly max: number;
  readonly aliases: Readonly<Record<string, number>> | null;
  readonly allowsQuestion: boolean;
}

const MONTH_ALIASES: Readonly<Record<string, number>> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const DAY_OF_WEEK_ALIASES: Readonly<Record<string, number>> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const FIELD_DEFS: readonly FieldDef[] = [
  { name: 'minute', min: 0, max: 59, aliases: null, allowsQuestion: false },
  { name: 'hour', min: 0, max: 23, aliases: null, allowsQuestion: false },
  { name: 'dayOfMonth', min: 1, max: 31, aliases: null, allowsQuestion: true },
  { name: 'month', min: 1, max: 12, aliases: MONTH_ALIASES, allowsQuestion: false },
  { name: 'dayOfWeek', min: 0, max: 6, aliases: DAY_OF_WEEK_ALIASES, allowsQuestion: true },
];

/** The expression each macro expands to. */
export const MACROS: Readonly<Record<CronMacro, string>> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

function parseValue(token: string, def: FieldDef): number {
  const text = token.trim().toLowerCase();
  if (text === '') {
    throw new CronParseError(`The ${def.name} field contains an empty value`, def.name, token);
  }
  let value: number;
  if (/^\d+$/.test(text)) {
    value = Number(text);
  } else if (def.aliases && text in def.aliases) {
    value = def.aliases[text];
  } else {
    throw new CronParseError(`"${token.trim()}" is not a valid ${def.name} value`, def.name, token);
  }
  // 7 is an accepted alias for Sunday in the day-of-week field.
  const upper = def.name === 'dayOfWeek' ? 7 : def.max;
  if (value < def.min || value > upper) {
    throw new CronParseError(
      `Value ${value} is out of range for the ${def.name} field (${def.min}-${def.max})`,
      def.name,
      token,
    );
  }
  return value;
}

function parseField(raw: string, def: FieldDef): CronField {
  const text = raw.trim();
  if (text === '') {
    throw new CronParseError(`The ${def.name} field is empty`, def.name, raw);
  }
  const segments: CronSegment[] = [];
  const values = new Set<number>();
  for (const rawPart of text.split(',')) {
    const part = rawPart.trim();
    if (part === '') {
      throw new CronParseError(
        `The ${def.name} field contains an empty item (check for double commas)`,
        def.name,
        rawPart,
      );
    }
    let body = part;
    let step: number | null = null;
    const slash = part.indexOf('/');
    if (slash !== -1) {
      body = part.slice(0, slash);
      const stepToken = part.slice(slash + 1).trim();
      if (!/^\d+$/.test(stepToken)) {
        throw new CronParseError(
          `Invalid step "${part.slice(slash + 1).trim()}" in the ${def.name} field`,
          def.name,
          part,
        );
      }
      step = Number(stepToken);
      if (step < 1) {
        throw new CronParseError(`Step must be at least 1 in the ${def.name} field`, def.name, part);
      }
    }
    let from: number;
    let to: number;
    if (body === '*' || body === '?') {
      if (body === '?' && !def.allowsQuestion) {
        throw new CronParseError(
          '"?" is only allowed in the dayOfMonth and dayOfWeek fields',
          def.name,
          part,
        );
      }
      from = def.min;
      to = def.max;
    } else {
      const dash = body.indexOf('-');
      if (dash !== -1) {
        from = parseValue(body.slice(0, dash), def);
        to = parseValue(body.slice(dash + 1), def);
        if (from > to) {
          throw new CronParseError(`Range "${body}" in the ${def.name} field is inverted`, def.name, part);
        }
      } else {
        from = parseValue(body, def);
        // "5/15" means "starting at 5, every 15 minutes".
        to = step !== null ? def.max : from;
      }
    }
    const effectiveStep = step ?? 1;
    for (let value = from; value <= to; value += effectiveStep) {
      values.add(def.name === 'dayOfWeek' && value === 7 ? 0 : value);
    }
    segments.push({ from, to, step });
  }
  const full = values.size === def.max - def.min + 1;
  return { name: def.name, min: def.min, max: def.max, values, segments, restricted: !full };
}

/**
 * Parse and validate a five-field cron expression.
 *
 * Accepted syntax per field: `*`, `?` (day fields only), single values,
 * lists (`1,15`), ranges (`1-5`), steps (`*/15`, `5/15`, `1-30/10`),
 * month names (`JAN`â`DEC`), weekday names (`SUN`â`SAT`), and `7` as
 * Sunday in the day-of-week field. The macros `@yearly`, `@annually`,
 * `@monthly`, `@weekly`, `@daily`, `@midnight` and `@hourly` are also
 * understood.
 *
 * @throws {CronParseError} if the expression is invalid.
 */
export function parseCron(expression: string): ParsedCron {
  if (typeof expression !== 'string') {
    throw new CronParseError('A cron expression must be a string');
  }
  const trimmed = expression.trim();
  if (trimmed === '') {
    throw new CronParseError('The cron expression is empty');
  }
  let macro: CronMacro | null = null;
  let body = trimmed;
  if (trimmed.startsWith('@')) {
    const key = trimmed.toLowerCase() as CronMacro;
    if (!(key in MACROS)) {
      throw new CronParseError(
        `Unknown macro "${trimmed}". Supported macros: ${Object.keys(MACROS).join(', ')}`,
      );
    }
    macro = key;
    body = MACROS[key];
  }
  const parts = body.split(/\s+/);
  if (parts.length === 6) {
    throw new CronParseError(
      'cronpoet supports 5-field cron expressions; a seconds field is not supported',
    );
  }
  if (parts.length !== 5) {
    throw new CronParseError(
      `Expected 5 fields (minute hour dayOfMonth month dayOfWeek), received ${parts.length}`,
    );
  }
  const fields = FIELD_DEFS.map((def, index) => parseField(parts[index], def));
  return {
    source: trimmed,
    macro,
    minute: fields[0],
    hour: fields[1],
    dayOfMonth: fields[2],
    month: fields[3],
    dayOfWeek: fields[4],
  };
}
