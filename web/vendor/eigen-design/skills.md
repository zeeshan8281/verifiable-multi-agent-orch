# @layr-labs/eigen-design — Skills Guide

> For AI agents building apps that use the @layr-labs/eigen-design component library.

## Installation

```bash
pnpm add @layr-labs/eigen-design
```

## Setup

### 1. Configure Tailwind to scan @layr-labs/eigen-design

@layr-labs/eigen-design components use Tailwind utility classes. Since `node_modules` is excluded from Tailwind's automatic scanning, you must register it as a source in your app's CSS:

```css
/* app/globals.css (Next.js) or src/index.css (Vite) */
@import "tailwindcss";
@source "@layr-labs/eigen-design/dist";
@import "@layr-labs/eigen-design/styles";
```

- `@source` tells Tailwind v4 to scan the package for utility classes used by components
- `@import "@layr-labs/eigen-design/styles"` loads the design tokens (colors, spacing, radii, fonts)

**Without the `@source` line, components will render unstyled.**

### 2. Load fonts

@layr-labs/eigen-design expects **Geist** (sans-serif) and **Geist Mono** (monospace). Georgia (serif) is a system font and requires no setup.

**Next.js:**

```bash
pnpm add geist
```

```tsx
// app/layout.tsx
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

**Vite / other React apps:**

```bash
pnpm add geist
```

```tsx
// src/main.tsx
import "geist/font/sans.css";
import "geist/font/mono.css";
import "./index.css";
```

If Geist is not loaded, components fall back to `ui-sans-serif` / `ui-monospace` (system fonts).

## Using Components

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from "@layr-labs/eigen-design";

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

## Available Components

| Component        | Import                                                       | Description              |
| ---------------- | ------------------------------------------------------------ | ------------------------ |
| `Badge`          | `import { Badge } from "@layr-labs/eigen-design"`                       | Status/label badge with variants: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`. Supports `asChild` for polymorphic rendering. |
| `Button`         | `import { Button } from "@layr-labs/eigen-design"`                      | Action button with variants: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`. Sizes: `xs`, `sm`, `default`, `lg`, `icon`, `icon-sm`, `icon-xs`, `icon-lg`. |
| `Card`           | `import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from "@layr-labs/eigen-design"` | Container card with compound sub-components. Sizes: `default`, `sm`. Use `CardAction` in header for action buttons. Footer has border-top and subtle bg. |
| `Dialog`         | `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@layr-labs/eigen-design"` | Modal dialog with overlay. Use `showCloseButton={false}` on `DialogContent` to hide the X icon. Footer has border-top and subtle muted background. |
| `DropdownMenu`   | `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, ... } from "@layr-labs/eigen-design"` | Accessible dropdown menu with items, checkboxes, radio groups, sub-menus, labels, separators, and keyboard shortcuts. Use `variant="destructive"` on items for danger actions. |
| `Input`          | `import { Input } from "@layr-labs/eigen-design"`                       | Text input field. Supports `type="file"` and `type="password"`. Use `aria-invalid="true"` for error state. |
| `Label`          | `import { Label } from "@layr-labs/eigen-design"`                       | Accessible form label. Wraps Radix Label primitive. Handles disabled and error peer states automatically. |
| `Skeleton`       | `import { Skeleton } from "@layr-labs/eigen-design"`                    | Loading placeholder with pulse animation. Apply sizing via `className` (e.g., `className="h-10 w-48"`). |
| `Switch`         | `import { Switch } from "@layr-labs/eigen-design"`                      | Toggle switch. Wraps Radix Switch primitive. Use `checked`/`onCheckedChange` for controlled state, `disabled` for disabled state. |
| `Textarea`       | `import { Textarea } from "@layr-labs/eigen-design"`                    | Multi-line text input. Use `aria-invalid="true"` for error state. |
| `Tooltip`        | `import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@layr-labs/eigen-design"` | Popup tooltip on hover/focus. Wrap app in `TooltipProvider`. Uses `bg-primary` with `text-primary-foreground`. Supports `side` prop for positioning. |

## Component Patterns

All components follow these conventions:

- **`className` prop**: Every component accepts `className` for custom styling. Classes are merged with `tailwind-merge` so your overrides win.
- **`ref` prop**: All components accept `ref` directly (React 19 — no `forwardRef` wrapper needed).
- **`asChild` prop** (Button): Pass `asChild` to render as a child element (e.g., wrapping a `<Link>`).
- **`data-slot` attributes**: Every component sets a `data-slot` attribute for CSS targeting.
- **Spread props**: All remaining HTML attributes are passed through to the root element.

```tsx
// Override styling
<Button className="w-full rounded-full">Full Width</Button>

// Pass ref directly (React 19)
const ref = useRef<HTMLButtonElement>(null);
<Button ref={ref}>Click</Button>

// Render as link
<Button asChild>
  <a href="/about">About</a>
</Button>

// Card with action button
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
    <CardAction>
      <Button variant="link" size="sm">Action</Button>
    </CardAction>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

## Design Tokens

The library ships design tokens as CSS custom properties via `@layr-labs/eigen-design/styles`. Light mode is the default; dark mode activates when the `.dark` class is on a parent element.

### Core

| Token                            | Tailwind class              | Usage                |
| -------------------------------- | --------------------------- | -------------------- |
| `--color-background`             | `bg-background`             | Page background      |
| `--color-foreground`             | `text-foreground`           | Default text         |
| `--color-primary`                | `bg-primary`                | Primary actions      |
| `--color-primary-foreground`     | `text-primary-foreground`   | Text on primary      |
| `--color-secondary`              | `bg-secondary`              | Secondary actions    |
| `--color-secondary-foreground`   | `text-secondary-foreground` | Text on secondary    |
| `--color-muted`                  | `bg-muted`                  | Subtle backgrounds   |
| `--color-muted-foreground`       | `text-muted-foreground`     | Secondary text       |
| `--color-accent`                 | `bg-accent`                 | Accent backgrounds   |
| `--color-accent-foreground`      | `text-accent-foreground`    | Text on accent       |
| `--color-destructive`            | `bg-destructive`            | Danger/delete        |
| `--color-destructive-foreground` | `text-destructive-foreground` | Text on destructive |

### Surfaces

| Token                            | Tailwind class              | Usage                |
| -------------------------------- | --------------------------- | -------------------- |
| `--color-card`                   | `bg-card`                   | Card backgrounds     |
| `--color-card-foreground`        | `text-card-foreground`      | Card text            |
| `--color-popover`                | `bg-popover`                | Popover backgrounds  |
| `--color-popover-foreground`     | `text-popover-foreground`   | Popover text         |

### Borders & Input

| Token                            | Tailwind class              | Usage                |
| -------------------------------- | --------------------------- | -------------------- |
| `--color-border`                 | `border-border`             | Default borders      |
| `--color-input`                  | `border-input`              | Input borders        |
| `--color-ring`                   | `ring-ring`                 | Focus rings          |

### Sidebar

| Token                                  | Tailwind class                    | Usage                     |
| -------------------------------------- | --------------------------------- | ------------------------- |
| `--color-sidebar`                      | `bg-sidebar`                      | Sidebar background        |
| `--color-sidebar-foreground`           | `text-sidebar-foreground`         | Sidebar text              |
| `--color-sidebar-primary`              | `bg-sidebar-primary`              | Active sidebar item       |
| `--color-sidebar-primary-foreground`   | `text-sidebar-primary-foreground` | Active sidebar item text  |
| `--color-sidebar-accent`              | `bg-sidebar-accent`               | Hover sidebar item        |
| `--color-sidebar-accent-foreground`   | `text-sidebar-accent-foreground`  | Hover sidebar item text   |
| `--color-sidebar-border`              | `border-sidebar-border`           | Sidebar borders           |
| `--color-sidebar-ring`                | `ring-sidebar-ring`               | Sidebar focus rings       |

### Chart

| Token              | Tailwind class    |
| ------------------ | ----------------- |
| `--color-chart-1`  | `bg-chart-1`      |
| `--color-chart-2`  | `bg-chart-2`      |
| `--color-chart-3`  | `bg-chart-3`      |
| `--color-chart-4`  | `bg-chart-4`      |
| `--color-chart-5`  | `bg-chart-5`      |

### Typography

| Token          | Tailwind class | Font stack                                        |
| -------------- | -------------- | ------------------------------------------------- |
| `--font-sans`  | `font-sans`    | Geist, ui-sans-serif, system-ui, sans-serif       |
| `--font-serif` | `font-serif`   | Georgia, Times New Roman, serif                   |
| `--font-mono`  | `font-mono`    | Geist Mono, ui-monospace, monospace               |

Geist and Geist Mono must be loaded by the consumer app (see Setup above). Georgia is a system font.

### Overriding Tokens

Override tokens in your app's CSS **after** the @layr-labs/eigen-design import:

```css
@import "tailwindcss";
@source "@layr-labs/eigen-design/dist";
@import "@layr-labs/eigen-design/styles";

/* Your overrides — these win because they come last */
@theme {
  --color-primary: #your-brand-color;
  --color-primary-foreground: #ffffff;
}
```

## Utilities

The `cn` utility is exported for merging Tailwind classes in your own components:

```tsx
import { cn } from "@layr-labs/eigen-design";

<div className={cn("p-4", isActive && "bg-primary")} />
```

## Troubleshooting

| Problem                        | Solution                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------- |
| Components render unstyled     | Add `@source "../node_modules/@layr-labs/eigen-design/dist"` to your CSS (see Setup above)   |
| Colors/tokens not applying     | Add `@import "@layr-labs/eigen-design/styles"` to your CSS                                   |
| Token overrides not working    | Ensure your `@theme` block comes **after** `@import "@layr-labs/eigen-design/styles"`        |
| Geist font not rendering       | Install `geist` package and load it in your app entry point (see Setup above)      |
| TypeScript can't find types    | Check that `@layr-labs/eigen-design` is installed (not just linked)                           |
