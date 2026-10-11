# Contributing to cronpoet

Thanks for your interest in improving cronpoet! This is a small, focused library, so the bar for additions is: **correct, tested, documented, dependency-free.**

## Getting set up

```bash
git clone https://github.com/adinax031-boop/Cronpoet.git
cd cronpoet
npm install
npm test
```

## Commands

| Command | What it does |
| --- | --- |
| `npm test` | Runs the Vitest suite |
| `npm run coverage` | Runs the suite with coverage |
| `npm run lint` | ESLint (flat config, `typescript-eslint` recommended) |
| `npm run typecheck` | Strict TypeScript check, no emit |
| `npm run build` | Compiles `src/` to `dist/` with declarations |

CI runs all of these on Node 20 and 22 for every push and pull request â PRs must pass before merging.

## Ground rules

1. **Zero runtime dependencies.** If a feature needs one, it probably belongs in a separate package.
2. **No new syntax surface without a semantics section.** Anything that changes how an expression is interpreted must be documented in the README, including edge cases.
3. **Every bug fix ships with a regression test.** Every feature ships with unit tests and an update to the README's supported-syntax or describer tables.
4. **Keep the public API stable.** Breaking changes require a major version bump and a CHANGELOG entry explaining the migration.
5. **Conventional commits** (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, â¦) keep the history readable.

## Pull requests

- Keep PRs focused: one topic per PR.
- Include a short description of *why* the change is needed, not just *what* changed.
- New describer output must be added to the table in `tests/describe.test.ts` with the exact expected sentence.

## Releasing

Releases are automated. When `main` is ready:

1. Update `CHANGELOG.md` and bump `package.json`.
2. Tag the commit: `git tag v1.0.1 && git push --tags`.
3. The [Release workflow](.github/workflows/release.yml) lints, typechecks, tests, builds, publishes to npm, and creates a GitHub release with generated notes.

> Publishing requires an `NPM_TOKEN` secret with publish rights for the `@adinax031-boop` scope.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
