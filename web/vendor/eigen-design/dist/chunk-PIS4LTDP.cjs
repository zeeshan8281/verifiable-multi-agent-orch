'use strict';

var chunkYUV2VNTR_cjs = require('./chunk-YUV2VNTR.cjs');
var radixUi = require('radix-ui');
var jsxRuntime = require('react/jsx-runtime');

function Switch({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    radixUi.Switch.Root,
    {
      "data-slot": "switch",
      className: chunkYUV2VNTR_cjs.cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-foreground data-[state=unchecked]:bg-input",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsxRuntime.jsx(
        radixUi.Switch.Thumb,
        {
          className: chunkYUV2VNTR_cjs.cn(
            "pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
          )
        }
      )
    }
  );
}

exports.Switch = Switch;
//# sourceMappingURL=chunk-PIS4LTDP.cjs.map
//# sourceMappingURL=chunk-PIS4LTDP.cjs.map