'use strict';

var chunkYUV2VNTR_cjs = require('./chunk-YUV2VNTR.cjs');
var jsxRuntime = require('react/jsx-runtime');

function Input({ className, type, ...props }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "input",
    {
      type,
      "data-slot": "input",
      className: chunkYUV2VNTR_cjs.cn(
        "flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:items-center file:h-full file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      ),
      ...props
    }
  );
}

exports.Input = Input;
//# sourceMappingURL=chunk-EVQ6VWTY.cjs.map
//# sourceMappingURL=chunk-EVQ6VWTY.cjs.map