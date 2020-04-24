var c11 = require('parser/c11').parser
var structTypes = require('parser/struct-types').parser 
var typedefs = require('parser/typedefs').parser
var path = require('fs')

export function generateJson(struct, fullmalloc) {
  c11.parser.yy.types.unshift(...typedefs.parse(fullmalloc),...structTypes.parse(struct));
  return c11.parse(struct);
}

