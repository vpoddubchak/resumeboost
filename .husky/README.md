# Pre-commit Hooks

## Purpose

Reduce code review issues by catching problems **before commit**:
- TypeScript type errors
- ESLint violations
- Code formatting issues

## What runs on commit

1. **ESLint** — auto-fix style issues
2. **Prettier** — format code
3. **TypeScript** — type check

Only runs on **staged files** (fast).

## Setup (already done)

```bash
npm install -D husky lint-staged
npx husky init
```

## Configuration

**package.json:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{ts,tsx}": "bash -c 'npm run type-check'"
  }
}
```

## Bypass (emergency only)

```bash
git commit --no-verify
```

⚠️ Use sparingly — defeats the purpose.

## Expected behavior

```bash
$ git commit -m "Add feature"
✔ Preparing lint-staged...
✔ Running tasks for staged files...
  ✔ *.{ts,tsx} — 3 files
    ✔ eslint --fix
    ✔ prettier --write
    ✔ tsc --noEmit
✔ Applying modifications...
✔ Cleaning up...
[main abc1234] Add feature
 3 files changed, 42 insertions(+)
```

## Troubleshooting

**Hook doesn't run:**
```bash
chmod +x .husky/pre-commit
```

**Type errors block commit:**
Fix the errors — that's the point! Or use `--no-verify` if urgent.

**Too slow:**
Type-check runs on **all files** (not just staged). This is intentional to catch cross-file type errors.
