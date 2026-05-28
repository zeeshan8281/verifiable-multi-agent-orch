'use strict';

var chunkYUV2VNTR_cjs = require('./chunk-YUV2VNTR.cjs');
var radixUi = require('radix-ui');
var jsxRuntime = require('react/jsx-runtime');

function TooltipProvider({
  delayDuration = 300,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    radixUi.Tooltip.Provider,
    {
      "data-slot": "tooltip-provider",
      delayDuration,
      ...props
    }
  );
}
function Tooltip(props) {
  return /* @__PURE__ */ jsxRuntime.jsx(radixUi.Tooltip.Root, { "data-slot": "tooltip", ...props });
}
function TooltipTrigger(props) {
  return /* @__PURE__ */ jsxRuntime.jsx(radixUi.Tooltip.Trigger, { "data-slot": "tooltip-trigger", ...props });
}
function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(radixUi.Tooltip.Portal, { children: /* @__PURE__ */ jsxRuntime.jsx(
    radixUi.Tooltip.Content,
    {
      "data-slot": "tooltip-content",
      sideOffset,
      className: chunkYUV2VNTR_cjs.cn(
        "z-50 max-w-sm overflow-hidden rounded-md bg-foreground px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      ),
      ...props
    }
  ) });
}

exports.Tooltip = Tooltip;
exports.TooltipContent = TooltipContent;
exports.TooltipProvider = TooltipProvider;
exports.TooltipTrigger = TooltipTrigger;
//# sourceMappingURL=chunk-J7YQT6VC.cjs.map
//# sourceMappingURL=chunk-J7YQT6VC.cjs.map