'use strict';

var chunkYUV2VNTR_cjs = require('./chunk-YUV2VNTR.cjs');
var jsxRuntime = require('react/jsx-runtime');

function Textarea({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "textarea",
    {
      "data-slot": "textarea",
      className: chunkYUV2VNTR_cjs.cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        className
      ),
      ...props
    }
  );
}

exports.Textarea = Textarea;
//# sourceMappingURL=chunk-UX2QM6V6.cjs.map
//# sourceMappingURL=chunk-UX2QM6V6.cjs.map