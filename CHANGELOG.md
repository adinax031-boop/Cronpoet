# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] â 2026-10-11

### Added

- `parseCron` â parse and validate five-field cron expressions: `*`, `?` (day fields), lists, ranges, steps (`*/n`, `a/n`, `a-b/n`), month and weekday names, `7` as Sunday, and the `@yearly` / `@annually` / `@monthly` / `@weekly` / `@daily` / `@midnight` / `@hourly` macros.
- `describeCron` / `describeParsed` â human-readable English descriptions, with `capital` and `period` formatting options.
- `nextCronRun` / `previousCronRun` / `nextCronRuns` â forward and backward scheduling with POSIX day-of-month/day-of-week OR semantics and a four-year search window.
- `CronExpression` â an object-oriented facade over the whole API.
- `CronParseError` â structured errors carrying the offending field and token.
- Tooling: strict TypeScript build, ESLint, Vitest test suite (100+ assertions), CI on Node 20 & 22, tag-driven npm release workflow, Dependabot, and full documentation.
