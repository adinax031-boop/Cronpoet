<div align="center">

# â±ï¸ cronpoet

**Cron expressions, in plain English.**

A zero-dependency TypeScript library that parses, validates, schedules â and *describes* â five-field cron expressions.

[![CI](https://github.com/adinax031-boop/Cronpoet/actions/workflows/ci.yml/badge.svg)](https://github.com/adinax031-boop/Cronpoet/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-3da639.svg)](LICENSE)
[![Dependencies](https://img.shields.io/badge/dependencies-0-44cc11.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](#)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-339933.svg)](#)

</div>

---

```ts
cronpoet.describeCron('30 8 * * 1-5')
// â "At 08:30, on Monday through Friday."
```

## â¨ Features

- ð **Parse & validate** â the full five-field syntax: `*`, lists, ranges, steps (`*/15`, `5/15`, `1-30/10`), month and weekday names (`JAN`, `MON`), `?` in the day fields, `7` as Sunday, and the classic `@daily`-style macros.
- ð£ **Describe in plain English** â any valid expression becomes a human sentence; any invalid one becomes a precise error naming the offending field *and* token.
- ð§­ **Schedule** â compute `next` and `previous` runs with correct POSIX day-of-month/day-of-week OR semantics, plus multi-run iteration.
- ðª¶ **Zero dependencies** â one small, tree-shakeable, ESM-only module with strict TypeScript types shipped in the box.
- ð§ª **Fully tested** â 100+ assertions across parsing, description and scheduling, including leap days, impossible dates and year boundaries.

## ð¦ Installation

```bash
npm install @adinax031-boop/cronpoet
```

Requires Node.js 18 or newer.

## ð Quick start

```ts
import { CronExpression } from '@adinax031-boop/cronpoet';

const schedule = CronExpression.parse('30 8 * * 1-5');

schedule.describe();
// â "At 08:30, on Monday through Friday."

schedule.next(new Date('2026-01-02T09:00:00Z'));
// â the following Monday at 08:30 (in the Date's own timezone)

schedule.previous(new Date('2026-01-02T07:00:00Z'));
// â Thursday 2026-01-01 at 08:30

schedule.nextRuns(new Date('2026-01-01T00:00:00Z'), 3);
// â [Jan 1, Jan 2, Jan 5] â the next three weekday runs
```

## ð£ The describer

| Expression | cronpoet says |
| --- | --- |
| `* * * * *` | Every minute. |
| `*/5 * * * *` | Every 5 minutes. |
| `10-59/15 * * * *` | Every 15 minutes, starting at minute 10. |
| `0 0 * * *` | At 00:00, every day. |
| `30 8 * * 1-5` | At 08:30, on Monday through Friday. |
| `15,45 9-17 * * 1` | At minute 15 and 45, from 09:00 to 17:59, on Monday. |
| `* 9 * * *` | Every minute, from 09:00 to 09:59. |
| `* */6 * * *` | Every minute, every 6 hours. |
| `0 6,18 * * *` | At minute 00, past hours 06 and 18, every day. |
| `0 12 1 * 0` | At 12:00, on day 1 of the month or on Sunday. |
| `0 0 29 2 *` | At 00:00, on day 29 of the month, in February. |
| `0 0 1 1 *` | At 00:00, on day 1 of the month, in January. |
| `@weekly` | At 00:00, on Sunday. |

Formatting is adjustable:

```ts
describeCron('30 8 * * 1-5', { capital: false, period: false });
// â "At 08:30, on Monday through Friday"
```

## ð§­ Scheduling notes

- `next` / `nextCronRun` return the first run **strictly after** the given date; `previous` / `previousCronRun` return the last run **strictly before** it.
- Runs are computed in whatever timezone the provided `Date` carries (local time of the environment, by default).
- The scheduler searches a **four-year window** â enough to reach any calendar day, including February 29th. Expressions that can never fire (like `0 0 31 2 *`) return `null` instead of throwing.

```ts
import { describeCron, nextCronRun, parseCron } from '@adinax031-boop/cronpoet';

const cron = parseCron('0 0 29 2 *');
nextCronRun(cron, new Date('2026-01-01T00:00:00Z')); // â 2028-02-29T00:00:00
```

## ð API

| Export | Description |
| --- | --- |
| `parseCron(expression)` | Validate and parse an expression into its five fields. Throws `CronParseError` on bad input. |
| `describeCron(expression, options?)` | Parse, then describe in plain English. |
| `describeParsed(cron, options?)` | Describe an expression you have already parsed. |
| `nextCronRun(cron, from?)` | First run strictly after `from` (default: now), or `null`. |
| `previousCronRun(cron, from?)` | Last run strictly before `from` (default: now), or `null`. |
| `nextCronRuns(cron, from, count)` | The first `count` runs at or after `from`. |
| `CronExpression` | Object-oriented facade: `.parse()`, `.describe()`, `.next()`, `.previous()`, `.nextRuns()`, `.fields`, `.source`, `.macro`. |
| `CronParseError` | Structured error with `.field` and `.segment` properties. |

A parsed expression exposes each field with its expanded `values`, original `segments`, bounds (`min`/`max`) and a `restricted` flag:

```ts
const cron = parseCron('*/15 9-17 * * MON-FRI');

cron.minute.values;    // Set {0, 15, 30, 45}
cron.hour.values;      // Set {9, 10, ..., 17}
cron.dayOfWeek.values; // Set {1, 2, 3, 4, 5}
cron.dayOfMonth.restricted; // false
```

## ð£ Supported syntax

| Feature | Example | Matches |
| --- | --- | --- |
| Any value | `*` | every value of the field |
| Single value | `30` | just that value |
| List | `1,15,30` | any of the values |
| Range | `1-5` | 1 through 5, inclusive |
| Step | `*/15` | every 15th value |
| Offset step | `5/15` | 5, 20, 35, 50 (extends to the field's max) |
| Range step | `10-50/10` | 10, 20, 30, 40, 50 |
| Month names | `JAN-DEC` | 1â12, case-insensitive |
| Weekday names | `SUN-SAT` | 0â6, case-insensitive |
| Sunday as 7 | `0 0 * * 7` | Sunday |
| `?` placeholder | `0 0 ? * 1` | same as `*`, day fields only |
| Macros | `@yearly` `@annually` `@monthly` `@weekly` `@daily` `@midnight` `@hourly` | their standard expansions |

Not supported (by design): six-field expressions with seconds, `L`/`W`/`#` extensions, and years.

## âï¸ Semantics

**Day-of-month vs. day-of-week.** Following POSIX cron: when *both* day fields are restricted (anything other than `*`/`?`), a day fires if it matches **either** field; when only one is restricted, that field alone decides; when neither is restricted, every day fires.

```
0 12 1 * 0    â noon on the 1st of the month *or* any Sunday
0 12 1 * *    â noon on the 1st of the month
0 12 * * 0    â noon on every Sunday
```

**Steps on a single value** (`5/15`) extend from that value to the end of the field, matching common Vixie-cron behaviour. **`?`** is accepted in the day fields and treated exactly like `*`.

## ð  Development

```bash
git clone https://github.com/adinax031-boop/Cronpoet.git
cd cronpoet
npm install

npm test          # run the test suite
npm run coverage  # run the suite with coverage
npm run lint      # ESLint
npm run typecheck # TypeScript, strict
npm run build     # compile to dist/
```

CI runs lint, typecheck, tests and the build on Node 20 and 22 for every push and pull request.

## ð License

[MIT](LICENSE) Â© 2026 adinax031-boop
