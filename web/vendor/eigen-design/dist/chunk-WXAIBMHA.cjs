'use strict';

var chunkYUV2VNTR_cjs = require('./chunk-YUV2VNTR.cjs');
var classVarianceAuthority = require('class-variance-authority');
var radixUi = require('radix-ui');
var jsxRuntime = require('react/jsx-runtime');

var badgeVariants = classVarianceAuthority.cva(
  "inline-flex items-center justify-center rounded-md border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-foreground text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive: "bg-destructive/10 text-destructive [a&]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:[a&]:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        outline: "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? radixUi.Slot.Root : "span";
  return /* @__PURE__ */ jsxRuntime.jsx(
    Comp,
    {
      "data-slot": "badge",
      "data-variant": variant,
      className: chunkYUV2VNTR_cjs.cn(badgeVariants({ variant }), className),
      ...props
    }
  );
}

exports.Badge = Badge;
exports.badgeVariants = badgeVariants;
//# sourceMappingURL=chunk-WXAIBMHA.cjs.map
//# sourceMappingURL=chunk-WXAIBMHA.cjs.map