---
name: Distributed Orchestration Command
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353943'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2ef'
  on-surface-variant: '#bdc8d1'
  inverse-surface: '#dfe2ef'
  inverse-on-surface: '#2c303a'
  outline: '#87929a'
  outline-variant: '#3e484f'
  surface-tint: '#7bd0ff'
  primary: '#8ed5ff'
  on-primary: '#00354a'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#00668a'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#ffc174'
  on-tertiary: '#472a00'
  tertiary-container: '#f59e0b'
  on-tertiary-container: '#613b00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0f131c'
  on-background: '#dfe2ef'
  surface-variant: '#31353f'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-base:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-base:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  body-bold:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: '0'
  caption:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.02em
  stat-metric:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  label-xs:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.5rem
  gutter-lg: 1.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xxs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

This design system establishes a high-performance visual command center engineered for distributed orchestration, sub-millisecond execution telemetry, and deterministic workflow state management. The visual atmosphere balances industrial server-room telemetry with surgical minimalist elegance. 

Targeted directly at distributed systems architects, platform reliability engineers, and backend systems operators, the interface evokes total determinism, high-throughput velocity, and deep architectural control. There is zero decorative clutter: every border, glow, and monospaced character corresponds to concrete runtime semantics such as monotonic event IDs, single-turn atomic commits, optimistic concurrency fencing, and brokerless in-memory synchronization.

The aesthetic fuses **Minimalism** and **Tactile Developer Tooling**:
- Deep obsidian bedrock canvas (`#070a10`) representing persistent PostgreSQL storage.
- Precision cold-slate surface tiers (`#0c121e`, `#111827`, `#1b2438`) structuring high-density inspection panels.
- Fine-gauge hairline steel borders (`#1e293b`, `#334155`) defining structural grids and panel splits without visual weight.
- Electric cyan (`#38bdf8`) signaling in-flight runtime execution and dynamic workflow state flow.
- Specialized status signals: Rendezvous violet (`#a855f7`) for brokerless sync-matching, deterministic emerald (`#10b981`) for completed tasks, and chrono amber (`#f59e0b`) for durable min-heap timers.

## Colors

The palette operates strictly in dark mode, optimizing luminance contrast for high-density runtime monitoring, streaming event logs, and complex DAG canvas views.

### Architectural Canvas & Elevation Tiers
- **Canvas Bedrock (`#070a10`)**: The deepest root background. Used for DAG canvas viewports, raw log viewers, and root body wrappers.
- **Surface Dim / Viewport Ground (`#0c121e`)**: Primary viewport background and workspace split panels.
- **Surface Container (`#111827`)**: Default surface for cards, drawers, dialog overlays, and header panels.
- **Surface Container High (`#1b2438`)**: Hover states, active list selections, tab highlights, and nested code blocks.
- **Surface Container Highest (`#243048`)**: Raised badges, active pills, and popover menus.

### Borders & Dividers
- **Hairline Border Steel (`#1e293b`)**: Structural separation between grid panels, DAG grid patterns, and table rows.
- **Prominent Border Steel (`#334155`)**: Interactive borders, input container frames, and focus outline boundaries.

### Interactive & Execution Semantics
- **Electric Cyan (`#38bdf8`)**: Primary brand and runtime velocity color. Signifies active workflow transitions, active network edges, and primary UI focus rings.
- **Deep Action Blue (`#0284c7`)**: Solid primary button fills, pressed CTA states, and prominent action triggers.
- **Sync-Match Violet (`#a855f7`)**: Brokerless in-memory rendezvous matching, worker memory channels, and direct handoffs.
- **Speculative Indigo (`#818cf8` / `#6366f1`)**: Speculative execution paths, transient tasks, and staged mutations.
- **Chrono Amber (`#f59e0b`)**: Durable min-heap timers (`container/heap`), schedule timeouts, and heartbeat monitor alerts.
- **Deterministic Emerald (`#10b981`)**: Verified completed executions, successful step executions, and verified OCC fencing token matches.
- **Error Rose (`#f43f5e`)**: Unhandled exceptions, dead-letter activity queues, and workflow termination errors.

### Text Contrast
- **Text Primary (`#f8fafc`)**: Viewport titles, active telemetry numbers, and primary readouts.
- **Text Secondary (`#94a3b8`)**: Parameter labels, event metadata, and schema keys.
- **Text Muted / De-emphasized (`#64748b`)**: Monotonic column labels, static timestamps, and disabled controls.

## Typography

The typographic hierarchy pairs the surgical, technical clarity of **Geist** for top-level layout navigation and headings with the mechanical precision of **JetBrains Mono** for all operational surfaces, telemetry readouts, logs, code displays, and execution metadata.

### Typographic Principles
- **Tabular Figures**: Every numeric telemetry value, timestamp, run duration, and monotonic event ID must enforce `font-variant-numeric: tabular-nums` to eliminate character jitter during rapid real-time data streaming.
- **Fixed Column Scanning**: Event tables and hash representations leverage fixed monospace character metrics (`ch`) for instantaneous vertical column parsing.
- **Scale Hierarchy**: Headlines in Geist structure the macro workspace, while JetBrains Mono anchors the developer tool experience in strict technical reality.

## Layout & Spacing

The design system operates on an uncompromising 4px spatial rhythm. Layout density is calibrated for high information density, allowing operators to monitor deep state trees without gratuitous scrolling.

### Layout Model
- **Command Workspace Layout**: A fixed-height viewport architecture (`100vh`) with three coordinated zones:
  1. Persistent top utility header (height: 56px / `3.5rem`).
  2. Collapsible navigation drawer / dock (width: 260px / `16.25rem`).
  3. Dynamic split-pane viewport containing a flexible DAG execution visualizer (`flex: 1`) alongside an append-only History Event table and detail slide-over drawer (width: 420px / `26.25rem`).
- **Data Tables & Event Rows**: Compact vertical height rhythm (36px to 40px per row) using `space-xs` (4px) to `space-sm` (8px) internal padding, ensuring maximum visible telemetry rows on standard developer displays.

### Responsive Breakpoints
- **Mobile (`< 640px`)**: Single-column view with collapsible event panels; DAG canvas transitions into a linear step-card timeline; drawer opens full-screen overlay.
- **Tablet (`640px - 1023px`)**: Sidebar collapses into a compact 56px icon dock; main workspace adopts a vertical split with DAG on top and history log stream below.
- **Desktop (`1024px+`)**: Full persistent split-pane view with real-time multi-channel telemetry and horizontal resizable pane dividers.

## Elevation & Depth

Depth is established primarily through **tonal surface layering** and **subtle luminous glows** rather than traditional heavy drop shadows. This preserves crisp visual edges and prevents blur noise in dense multi-window developer tools.

### Elevation Hierarchy
- **Base Canvas (Ground 0)**: Obsidian `#070a10` with zero shadow.
- **Level 1 (Panels & Workspace Shells)**: Slate `#0c121e` framed by a 1px solid hairline border `#1e293b`.
- **Level 2 (Cards, Floating Nodes, Menus)**: Container `#111827` framed by 1px solid `#1e293b` with ambient shadow `0 4px 12px -2px rgba(0, 0, 0, 0.5)`.
- **Level 3 (Modal Dialogs, Slide-Over Drawers)**: Surface `#111827` framed by 1px solid `#334155` with deep elevation shadow `0 16px 36px -8px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.04)`.

### Luminous Accent Lighting
Interactive and running states emit restrained, chromatic ambient halos:
- **Active Execution Node**: `box-shadow: 0 0 16px -2px rgba(56, 189, 248, 0.25), inset 0 0 0 1px rgba(56, 189, 248, 0.4)`.
- **Sync-Match Rendezvous Indicator**: `box-shadow: 0 0 12px -2px rgba(168, 85, 247, 0.3)`.
- **Error / Deadline Failure**: `box-shadow: 0 0 12px -2px rgba(244, 63, 94, 0.3)`.

## Shapes

With `roundedness: 1`, the interface adheres to a refined, soft-industrial aesthetic:
- **Base Radius (`0.25rem` / 4px)**: Standard buttons, text inputs, code chips, event pills, and table cell tags.
- **Container Radius (`rounded-lg`, `0.5rem` / 8px)**: Workflow cards, DAG step nodes, telemetry gauge boxes, and modal containers.
- **Drawer / Canvas Radius (`rounded-xl`, `0.75rem` / 12px)**: Large slide-out inspector panels and canvas boundary frames.
- **Pills / Status Beacons (`9999px`)**: Activity execution status dots, OCC fencing indicators, and live network pulse badges.

This tight corner radius reinforces technical precision, aligning cleanly with code editors and terminal surfaces.

## Components

### Buttons
- **Primary Dispatch (CTA)**: Background `#0284c7`, text `#ffffff` (Geist 600, 13px), border radius 4px (`rounded`). Subtle top-edge inner highlight `inset 0 1px 0 rgba(255, 255, 255, 0.2)`. Hover: background `#0369a1` with cyan glow `0 0 12px rgba(56, 189, 248, 0.35)`.
- **Secondary / Query**: Background `#1b2438`, 1px border `#334155`, text `#f1f5f9`. Hover: border `#38bdf8`, background `#243048`.
- **Destructive (Terminate / Cancel)**: Background `#881337`, 1px border `#f43f5e`, text `#fecdd3`. Hover: background `#9f1239` with rose glow.
- **Icon Utility Button**: 32x32px, transparent background, 1px border transparent. Hover: background `rgba(255, 255, 255, 0.06)`, border `#334155`.

### Chips & Badges
- **Status Pills**: Compact height (20px), padding 2px 8px, font JetBrains Mono (11px, weight 500).
  - *Running*: Background `rgba(56, 189, 248, 0.12)`, text `#38bdf8`, border 1px solid `rgba(56, 189, 248, 0.3)`, with pulsing dot.
  - *Completed*: Background `rgba(16, 185, 129, 0.12)`, text `#10b981`, border 1px solid `rgba(16, 185, 129, 0.3)`.
  - *Failed*: Background `rgba(244, 63, 94, 0.12)`, text `#f43f5e`, border 1px solid `rgba(244, 63, 94, 0.3)`.
  - *Sync-Match*: Background `rgba(168, 85, 247, 0.12)`, text `#a855f7`, border 1px solid `rgba(168, 85, 247, 0.3)`.

### Form Controls & Inputs
- **Text & Code Inputs**: Background `#070a10`, border 1px solid `#334155`, text `#f8fafc`, font JetBrains Mono (13px). Height 36px, internal padding 6px 12px.
- **Focus State**: Border `#38bdf8`, box-shadow `0 0 0 2px rgba(56, 189, 248, 0.25)`.
- **Checkboxes & Radios**: 16x16px, background `#0c121e`, border 1px solid `#334155`, radius 3px. Checked: background `#0284c7`, border `#38bdf8`.

### Event Stream Tables
- **Header**: Height 32px, background `#090d16`, border-bottom 1px solid `#1e293b`, typography caption uppercase in `#64748b`.
- **Rows**: Height 38px, alternating stripes `#0c121e` and `#0f1524`, border-bottom 1px solid `rgba(30, 41, 59, 0.5)`. Hover background `#1b2438`.
- **Monotonic ID**: Width 54px, JetBrains Mono bold `#38bdf8`.

### DAG Graph Nodes & Connectors
- **DAG Node Card**: Fixed width 220px, minimum height 76px, background `#111827`, border 1px solid `#1e293b`, radius 8px (`rounded-lg`).
- **Lifecycle Color Stripe**: 3px vertical bar on left edge reflecting node state (Running cyan, Succeeded emerald, Failed rose).
- **Node Connectors**: 2px stroke SVG orthogonal paths `#334155`. In-flight path: `#38bdf8` with animated dash array traversal.

### Telemetry Stat Cards
- **Card Container**: Background `#111827`, border 1px solid `#1e293b`, padding 16px, radius 8px.
- **Metric Figure**: JetBrains Mono 28px bold `#f8fafc` with `font-variant-numeric: tabular-nums`.
- **Caption Label**: Geist 12px medium `#94a3b8` with status indicator or turn latency comparison readout.