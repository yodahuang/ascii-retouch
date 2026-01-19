# ASCII Retouch

Align misaligned ASCII text diagrams. Runs locally in your browser.

## What it does

Paste a diagram with slightly off edges like this:

```
      ┌──────────────────┐
     │    PRE-TRAINING   │
     │   (some details)   │
     └──────────────────┘
              │
              v
  ┌────────────────────────┐
  │      POST-TRAINING     │
  └────────────────────────┘
```

Get back a clean, aligned version:

```
    ┌──────────────────┐
    │    PRE-TRAINING  │
    │   (some details) │
    └──────────────────┘
            │
            v
┌────────────────────────┐
│      POST-TRAINING     │
└────────────────────────┘
```

## Features

- Detects box structures (┌┐└┘│)
- Aligns boxes to the widest one in each column
- Fixes misaligned edges within boxes
- Extends horizontal borders properly (no extra spaces)
- Shifts connector lines (│ v ^ etc.) to match box centers
- Preserves multi-column layouts

## Development

```bash
# Enter dev environment (requires devenv)
devenv shell

# Run tests
test

# Start local server
dev

# Lint
lint

# Lint and fix
lint:fix
```

## Deploy

Static site - deploy anywhere. No build step required.

For Cloudflare Pages:
- Build command: *(leave empty)*
- Build output directory: `/`
