import { cn } from './chunk-DGPY4WP3.js';
import { Tooltip as Tooltip$1 } from 'radix-ui';
import { jsx } from 'react/jsx-runtime';

function TooltipProvider({
  delayDuration = 300,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Tooltip$1.Provider,
    {
      "data-slot": "tooltip-provider",
      delayDuration,
      ...props
    }
  );
}
function Tooltip(props) {
  return /* @__PURE__ */ jsx(Tooltip$1.Root, { "data-slot": "tooltip", ...props });
}
function TooltipTrigger(props) {
  return /* @__PURE__ */ jsx(Tooltip$1.Trigger, { "data-slot": "tooltip-trigger", ...props });
}
function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}) {
  return /* @__PURE__ */ jsx(Tooltip$1.Portal, { children: /* @__PURE__ */ jsx(
    Tooltip$1.Content,
    {
      "data-slot": "tooltip-content",
      sideOffset,
      className: cn(
        "z-50 max-w-sm overflow-hidden rounded-md bg-foreground px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      ),
      ...props
    }
  ) });
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
//# sourceMappingURL=chunk-EJDOBYAE.js.map
//# sourceMappingURL=chunk-EJDOBYAE.js.map