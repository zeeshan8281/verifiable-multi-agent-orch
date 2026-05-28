'use strict';

var clsx = require('clsx');
var tailwindMerge = require('tailwind-merge');

// src/lib/utils.ts
function cn(...inputs) {
  return tailwindMerge.twMerge(clsx.clsx(inputs));
}

exports.cn = cn;
//# sourceMappingURL=chunk-YUV2VNTR.cjs.map
//# sourceMappingURL=chunk-YUV2VNTR.cjs.map