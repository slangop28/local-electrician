# Agent Skills Documentation

Complete documentation of all agent skills available in this repository. These skills extend AI coding agent capabilities with specialized guidance for development tasks.

---

## Table of Contents

1. [Overview](#overview)
2. [Available Skills](#available-skills)
3. [Creating New Skills](#creating-new-skills)
4. [React Best Practices](#react-best-practices)
5. [Composition Patterns](#composition-patterns)
6. [Web Design Guidelines](#web-design-guidelines)
7. [React Native Skills](#react-native-skills)
8. [Installation & Usage](#installation--usage)

---

## Overview

Agent Skills are packaged instructions and scripts that extend agent capabilities. Skills follow the Agent Skills format and are optimized for AI coding agents like Claude, Cursor, and Copilot.

### Key Features

- **On-demand loading** - Only skill descriptions load at startup; full content loads when relevant
- **Context efficient** - Keep under 500 lines, use progressive disclosure
- **Script-based** - Executable scripts don't consume context (only output does)
- **Framework detection** - Auto-detects frameworks from `package.json`
- **Easy distribution** - Package skills as `.zip` files for sharing

---

## Available Skills

### 1. React Best Practices

**Name:** `vercel-react-best-practices`

**Description:** React and Next.js performance optimization guidelines from Vercel Engineering. Contains 57 rules across 8 categories, prioritized by impact.

**Use when:**
- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

**Categories (Priority Order):**

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

**Key Rules:**

#### 1. Eliminating Waterfalls (CRITICAL)
- `async-defer-await` - Move await into branches where actually used
- `async-parallel` - Use Promise.all() for independent operations
- `async-dependencies` - Use better-all for partial dependencies
- `async-api-routes` - Start promises early, await late in API routes
- `async-suspense-boundaries` - Use Suspense to stream content

#### 2. Bundle Size Optimization (CRITICAL)
- `bundle-barrel-imports` - Import directly, avoid barrel files
- `bundle-dynamic-imports` - Use next/dynamic for heavy components
- `bundle-defer-third-party` - Load analytics/logging after hydration
- `bundle-conditional` - Load modules only when feature is activated
- `bundle-preload` - Preload on hover/focus for perceived speed

#### 3. Server-Side Performance (HIGH)
- `server-auth-actions` - Authenticate server actions like API routes
- `server-cache-react` - Use React.cache() for per-request deduplication
- `server-cache-lru` - Use LRU cache for cross-request caching
- `server-dedup-props` - Avoid duplicate serialization in RSC props
- `server-serialization` - Minimize data passed to client components
- `server-parallel-fetching` - Restructure components to parallelize fetches
- `server-after-nonblocking` - Use after() for non-blocking operations

#### 4. Client-Side Data Fetching (MEDIUM-HIGH)
- `client-swr-dedup` - Use SWR for automatic request deduplication
- `client-event-listeners` - Deduplicate global event listeners
- `client-passive-event-listeners` - Use passive listeners for scroll
- `client-localstorage-schema` - Version and minimize localStorage data

#### 5. Re-render Optimization (MEDIUM)
- `rerender-defer-reads` - Don't subscribe to state only used in callbacks
- `rerender-memo` - Extract expensive work into memoized components
- `rerender-memo-with-default-value` - Hoist default non-primitive props
- `rerender-dependencies` - Use primitive dependencies in effects
- `rerender-derived-state` - Subscribe to derived booleans, not raw values
- `rerender-derived-state-no-effect` - Derive state during render, not effects
- `rerender-functional-setstate` - Use functional setState for stable callbacks
- `rerender-lazy-state-init` - Pass function to useState for expensive values
- `rerender-simple-expression-in-memo` - Avoid memo for simple primitives
- `rerender-move-effect-to-event` - Put interaction logic in event handlers
- `rerender-transitions` - Use startTransition for non-urgent updates
- `rerender-use-ref-transient-values` - Use refs for transient frequent values

#### 6. Rendering Performance (MEDIUM)
- `rendering-animate-svg-wrapper` - Animate div wrapper, not SVG element
- `rendering-content-visibility` - Use content-visibility for long lists
- `rendering-hoist-jsx` - Extract static JSX outside components
- `rendering-svg-precision` - Reduce SVG coordinate precision
- `rendering-hydration-no-flicker` - Use inline script for client-only data
- `rendering-hydration-suppress-warning` - Suppress expected mismatches
- `rendering-activity` - Use Activity component for show/hide
- `rendering-conditional-render` - Use ternary, not && for conditionals
- `rendering-usetransition-loading` - Prefer useTransition for loading state

#### 7. JavaScript Performance (LOW-MEDIUM)
- `js-batch-dom-css` - Group CSS changes via classes or cssText
- `js-index-maps` - Build Map for repeated lookups
- `js-cache-property-access` - Cache object properties in loops
- `js-cache-function-results` - Cache function results in module-level Map
- `js-cache-storage` - Cache localStorage/sessionStorage reads
- `js-combine-iterations` - Combine multiple filter/map into one loop
- `js-length-check-first` - Check array length before expensive comparison
- `js-early-exit` - Return early from functions
- `js-hoist-regexp` - Hoist RegExp creation outside loops
- `js-min-max-loop` - Use loop for min/max instead of sort
- `js-set-map-lookups` - Use Set/Map for O(1) lookups
- `js-tosorted-immutable` - Use toSorted() for immutability

#### 8. Advanced Patterns (LOW)
- `advanced-event-handler-refs` - Store event handlers in refs
- `advanced-init-once` - Initialize app once per app load
- `advanced-use-latest` - useLatest for stable callback refs

---

### 2. Composition Patterns

**Name:** `vercel-composition-patterns`

**Description:** React composition patterns that scale. Avoid boolean prop proliferation by using compound components, lifting state, and composing internals. Includes React 19 API changes.

**Use when:**
- Refactoring components with many boolean props
- Building reusable component libraries
- Designing flexible component APIs
- Reviewing component architecture
- Working with compound components or context providers

**Categories (Priority Order):**

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Component Architecture | HIGH | `architecture-` |
| 2 | State Management | MEDIUM | `state-` |
| 3 | Implementation Patterns | MEDIUM | `patterns-` |
| 4 | React 19 APIs | MEDIUM | `react19-` |

**Key Rules:**

#### 1. Component Architecture (HIGH)
- `architecture-avoid-boolean-props` - Don't add boolean props to customize behavior; use composition
- `architecture-compound-components` - Structure complex components with shared context

#### 2. State Management (MEDIUM)
- `state-decouple-implementation` - Provider is the only place that knows how state is managed
- `state-context-interface` - Define generic interface with state, actions, meta for dependency injection
- `state-lift-state` - Move state into provider components for sibling access

#### 3. Implementation Patterns (MEDIUM)
- `patterns-explicit-variants` - Create explicit variant components instead of boolean modes
- `patterns-children-over-render-props` - Use children for composition instead of renderX props

#### 4. React 19 APIs (MEDIUM - React 19+ only)
- `react19-no-forwardref` - Don't use `forwardRef`; use `use()` instead of `useContext()`

---

### 3. Web Design Guidelines

**Name:** `web-design-guidelines`

**Description:** Review UI code for compliance with Web Interface Guidelines. Audits code for 100+ rules covering accessibility, performance, and UX.

**Use when:**
- "Review my UI"
- "Check accessibility"
- "Audit design"
- "Review UX"
- "Check my site against best practices"

**Categories Covered:**
- Accessibility (aria-labels, semantic HTML, keyboard handlers)
- Focus States (visible focus, focus-visible patterns)
- Forms (autocomplete, validation, error handling)
- Animation (prefers-reduced-motion, compositor-friendly transforms)
- Typography (curly quotes, ellipsis, tabular-nums)
- Images (dimensions, lazy loading, alt text)
- Performance (virtualization, layout thrashing, preconnect)
- Navigation & State (URL reflects state, deep-linking)
- Dark Mode & Theming (color-scheme, theme-color meta)
- Touch & Interaction (touch-action, tap-highlight)
- Locale & i18n (Intl.DateTimeFormat, Intl.NumberFormat)

**How It Works:**
1. Fetch latest guidelines from GitHub
2. Read specified files (or prompt for files)
3. Check against all 100+ rules
4. Output findings in `file:line` format
5. Reference: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

---

### 4. React Native Skills

**Name:** `react-native-skills`

**Description:** React Native best practices optimized for AI agents. Contains 16 rules across 7 sections covering performance, architecture, and platform-specific patterns.

**Use when:**
- Building React Native or Expo apps
- Optimizing mobile performance
- Implementing animations or gestures
- Working with native modules or platform APIs

**Categories Covered:**
- Performance (Critical) - FlashList, memoization, heavy computation
- Layout (High) - flex patterns, safe areas, keyboard handling
- Animation (High) - Reanimated, gesture handling
- Images (Medium) - expo-image, caching, lazy loading
- State Management (Medium) - Zustand patterns, React Compiler
- Architecture (Medium) - monorepo structure, imports
- Platform (Medium) - iOS/Android specific patterns

---

## Creating New Skills

### Directory Structure

```
skills/
  {skill-name}/           # kebab-case directory name
    SKILL.md              # Required: skill definition
    scripts/              # Required: executable scripts
      {script-name}.sh    # Bash scripts (preferred)
  {skill-name}.zip        # Required: packaged for distribution
```

### Naming Conventions

- **Skill directory**: `kebab-case` (e.g., `vercel-deploy`, `log-monitor`)
- **SKILL.md**: Always uppercase, always this exact filename
- **Scripts**: `kebab-case.sh` (e.g., `deploy.sh`, `fetch-logs.sh`)
- **Zip file**: Must match directory name exactly: `{skill-name}.zip`

### SKILL.md Format

```markdown
---
name: {skill-name}
description: {One sentence describing when to use this skill. Include trigger phrases like "Deploy my app", "Check logs", etc.}
---

# {Skill Title}

{Brief description of what the skill does.}

## How It Works

{Numbered list explaining the skill's workflow}

## Usage

```bash
bash /mnt/skills/user/{skill-name}/scripts/{script}.sh [args]
```

**Arguments:**
- `arg1` - Description (defaults to X)

**Examples:**
{Show 2-3 common usage patterns}

## Output

{Show example output users will see}

## Present Results to User

{Template for how Claude should format results when presenting to users}

## Troubleshooting

{Common issues and solutions, especially network/permissions errors}
```

### Best Practices for Context Efficiency

- **Keep SKILL.md under 500 lines** — put detailed reference material in separate files
- **Write specific descriptions** — helps the agent know exactly when to activate the skill
- **Use progressive disclosure** — reference supporting files that get read only when needed
- **Prefer scripts over inline code** — script execution doesn't consume context (only output does)
- **File references work one level deep** — link directly from SKILL.md to supporting files

### Script Requirements

- Use `#!/bin/bash` shebang
- Use `set -e` for fail-fast behavior
- Write status messages to stderr: `echo "Message" >&2`
- Write machine-readable output (JSON) to stdout
- Include a cleanup trap for temp files
- Reference the script path as `/mnt/skills/user/{skill-name}/scripts/{script}.sh`

### Creating the Zip Package

After creating or updating a skill:

```bash
cd skills
zip -r {skill-name}.zip {skill-name}/
```

### End-User Installation

**Claude Code:**
```bash
cp -r skills/{skill-name} ~/.claude/skills/
```

**claude.ai:**
Add the skill to project knowledge or paste SKILL.md contents into the conversation.

If the skill requires network access, instruct users to add required domains at `claude.ai/settings/capabilities`.

---

## Installation & Usage

### Installation

```bash
npx skills add vercel-labs/agent-skills
```

### Usage Examples

```
"Review this React component for performance issues"
```

```
"Review my UI for accessibility"
```

```
"Help me optimize this Next.js page"
```

```
"Refactor this component to use composition patterns"
```

```
"Check my mobile app for React Native best practices"
```

### Skills Activation

Skills are automatically available once installed. The agent will use them when relevant tasks are detected based on:
- Skill description and trigger phrases
- Task context and keywords
- Code patterns and file types

---

## Skill Structure Details

Each skill contains:
- **SKILL.md** - Instructions and guidelines for the agent
- **scripts/** - Helper scripts for automation (optional but recommended)
- **references/** - Supporting documentation and detailed rules (optional)

---

## License

All skills are licensed under MIT.

---

## Support & Contributing

For issues, improvements, or new skill ideas, please refer to the individual skill directories:

- `skills/react-best-practices/` - React/Next.js performance
- `skills/composition-patterns/` - Component architecture
- `skills/web-design-guidelines/` - UI/UX compliance
- `skills/react-native-skills/` - React Native development

---

**Last Updated:** February 11, 2026

**Repository:** Local Electrician Agent Skills
