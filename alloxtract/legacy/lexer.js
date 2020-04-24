const moo = require('moo')

var lexer = moo.compile({
  tk_p_define: {
    match: /#[\t ]*define/
  },
  tk_p_undef: {
    match: /#[\t ]*undef/
  },
  tk_p_else: {
    match: /#[\t ]*else[^\n]*\n/
  },
  tk_p_ifndef: {
    match: /#[\t ]*ifndef/
  },
  tk_p_if: {
    match: /#[\t ]*if/
  },
  tk_p_endif: {
    match: /#[\t ]*endif/
  },
  tk_p_ifdef: {
    match: /#[\t ]*ifdef/
  },
  tk_p_comment: {
    match: /\/\*[\d\D]*?\*\/|\/.*|\/\*[\s\S]*?\*/,
    lineBreaks: true
  },
  tk_identifier: {
    match: /[a-zA-Z_](?:[a-zA-Z_]|[0-9])*/,
    type: moo.keywords({
      tk_auto: 'auto',
      tk_break: 'break',
      tk_case: 'case',
      tk_char: 'char',
      tk_const: 'const',
      tk_continue: 'continue',
      tk_default: 'default',
      tk_do: 'do',
      tk_double: 'double',
      tk_else: 'else',
      tk_enum: 'enum',
      tk_extern: 'extern',
      tk_float: 'float',
      tk_for: 'for',
      tk_goto: 'goto',
      tk_if: 'if',
      tk_int: 'int',
      tk_long: 'long',
      tk_register: 'register',
      tk_return: 'return',
      tk_short: 'short',
      tk_signed: 'signed',
      tk_sizeof: 'sizeof',
      tk_static: 'static',
      tk_struct: 'struct',
      tk_switch: 'switch',
      tk_typedef: 'typedef',
      tk_union: 'union',
      tk_unsigned: 'unsigned',
      tk_void: 'void',
      tk_volatile: 'volatile',
      tk_while: 'while'
    })
  },
  tk_integer_constant: {
    match: /0[xX][a-fA-F0-9]+(?:u|U|l|L)*?|0[0-9]+(?:u|U|l|L)*?|[0-9]+(?:u|U|l|L)*?|[0-9]+[Ee][+-]?[0-9]+/
  },
  tk_character_constant: {
    match: /L?'(?:\\.|[^\\'])+'/
  },
  tk_floating_constant: {
    match: /[0-9]+\.[0-9]+(?:[Ee][+-]?{D}+)?(?:f|F|l|L)?|[0-9]+\.[0-9]*(?:[Ee][+-]?{D}+)?(?:f|F|l|L)?/
  },
  tk_enumeration_constant: {
    match: /[a-zA-Z_](?:[a-zA-Z_]|[0-9])*/
  },
  tk_string_literal: {
    match: /L?"(?:\\.|[^\\"])*"/
  },
  tk_ellipsis: '...',
  tk_right_assign: '>>=',
  tk_left_assign: '<<=',
  tk_add_assign: '+=',
  tk_sub_assign: '-=',
  tk_mul_assign: '*=',
  tk_div_assign: '/=',
  tk_mod_assign: '%=',
  tk_and_assign: '&=',
  tk_xor_assign: '^=',
  tk_or_assign: '|=',
  tk_right_op: '>>',
  tk_left_op: '<<',
  tk_inc_op: '++',
  tk_dec_op: '--',
  tk_ptr_op: '->',
  tk_and_op: '&&',
  tk_or_op: '||',
  tk_le_op: '<=',
  tk_ge_op: '>=',
  tk_eq_op: '==',
  tk_ne_op: '!=',
  ';': ';',
  '{': '{',
  '}': '}',
  ',': ',',
  ':': ':',
  '=': '=',
  '(': '(',
  ')': ')',
  '[': '[',
  ']': ']',
  '.': '.',
  '&': '&',
  '!': '!',
  '~': '~',
  '-': '-',
  '+': '+',
  '*': '*',
  '/': '/',
  '%': '%',
  '<': '<',
  '>': '>',
  '^': '^',
  '|': '|',
  '?': '?',
  tk_ws: {
    match: /[ \t\n\r\f]+/,
    lineBreaks: true
  }
})

module.exports = lexer
