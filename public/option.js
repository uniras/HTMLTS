//<%
global.UglifyOption = {
  "mangle": true,
  "compress": {
      "sequences": true,
      "properties": true,
      "dead_code": true,
      "drop_debugger": true,
      "unsafe": false,
      "unsafe_comps": false,
      "conditionals": true,
      "comparisons": true,
      "evaluate": true,
      "booleans": true,
      "loops": true,
      "unused": true,
      "hoist_funs": true,
      "keep_fargs": true,
      "keep_fnames": false,
      "hoist_vars": false,
      "if_return": true,
      "join_vars": true,
      "collapse_vars": false,
      "reduce_vars": false,
      "side_effects": true,
      "pure_getters": false,
      "pure_funcs": null,
      "negate_iife": false,
      "drop_console": false,
      "passes": 1,
      "global_defs": {}
  },
  "output": {
      "ascii_only": false,
      "inline_script": false,
      "max_line_len": 32000,
      "braces": false,
      "semicolons": true,
      "comments": false,
      "shebang": true,
      "preamble": null,
      "quote_style": "best"
  }
};
//%>