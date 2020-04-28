var c11 = require('./parsers/c11').parser
var structTypes = require('./parsers/struct-types').parser 
var typedefs = require('./parsers/typedefs').parser
var defines = require('./parsers/defines').parser
var fs = require('fs')
var path = require('path')

function generateJson (struct, fullmalloc) {
  c11.yy.types = []
  c11.yy.enumConstants = []
  var fullmallocPreprocessed = defines.parse(fullmalloc);
  fullmalloc = fullmallocPreprocessed.code;
  c11.yy.defines = fullmallocPreprocessed.defines;
  var structPreprocessed = defines.parse(struct);
  struct = structPreprocessed.code;
  c11.yy.types.unshift(...typedefs.parse(fullmalloc));
  c11.yy.types.unshift(...structTypes.parse(struct));
  return {
    struct: c11.parse(struct),
    defs: c11.yy.defines
  };
}
function sliceObject(obj, key) {
var value;
  Object.keys(object).some(function(k) {
      if (k === key) {
          value = object[k];
          return true;
      }
      if (object[k] && typeof object[k] === 'object') {
          value = sliceObject(object[k], key);
          return value !== undefined;
      }
  });
  return value;
}

function getMallocChunkMemberType(decl) {
  var proto = {};
  for (var struct_declaration in decl) {
    if (struct_declaration.type == 'struct_declaration') {
      /* We have a valid declaration we want to include in the proto */

    }
  }
}

var szmap = {
  
}

function getMallocStateMemberType(decl) {
  var proto = {};
  for (var struct_declaration in decl) {
    if (struct_declaration.type == 'struct_declaration') {
      /* We have a valid declaration we want to include in the proto */
      var sql = struct_declaration.specifier_qualifier_list;
      var sdl = struct_declaration.struct_declarator_list;



    }
  }
}

function protoJsonMallocChunk(struct, defines, size) {
  var declList = sliceObject(struct, 'struct_declaration_list');
  var proto = {};
  for (var decl in declList) {
    var type = getMallocChunkMemberType(decl);

  }


}



exports.main = function (args) {
  if (!args[1] || !args[2]) {
    console.log('Usage:', path.basename(args[0]) + ' FILE MALLOCFILE')
    process.exit(1)
  }
  var source = fs.readFileSync(path.normalize(args[1]), 'utf8')
  var mallocSource = fs.readFileSync(path.normalize(args[2]), 'utf8')

  var dst = generateJson(source, mallocSource)
  console.log('parser output:\n\n', {
    type: typeof dst,
    value: dst
  })
  try {
    console.log("\n\nor as JSON:\n", JSON.stringify(dst, null, 2))
  } catch (e) { /* ignore crashes; output MAY not be serializable! We are a generic bit of code, after all... */ }
  var rv = 0
  if (typeof dst === 'number' || typeof dst === 'boolean') {
    rv = dst
  }
  return dst
}

if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1))
}

exports.generateJson = generateJson
