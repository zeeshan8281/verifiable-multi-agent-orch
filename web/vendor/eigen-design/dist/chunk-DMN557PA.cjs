'use strict';

var chunkYUV2VNTR_cjs = require('./chunk-YUV2VNTR.cjs');
var radixUi = require('radix-ui');
var jsxRuntime = require('react/jsx-runtime');

function Label({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    radixUi.Label.Root,
    {
      "data-slot": "label",
      className: chunkYUV2VNTR_cjs.cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      ),
      ...props
    }
  );
}

exports.Label = Label;
//# sourceMappingURL=chunk-DMN557PA.cjs.map
//# sourceMappingURL=chunk-DMN557PA.cjs.map