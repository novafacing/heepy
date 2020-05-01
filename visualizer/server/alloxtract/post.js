var fs = require('fs');
var path = require('path');
var process = require('process');
var arch = require('arch');
var gettypedefs = require('./parsers/gettypedefs').parser

var defspath = path.resolve(path.join('.', 'defs'));
if (arch() === 'x86') {
  var ptrsize = 4;
} else {
  var ptrsize = 8;
}

let sliceObject = (needle, haystack, found = []) => {
  Object.keys(haystack).forEach((key) => {
    if(key === needle){
      found.push(haystack[key]);
      return found;
    }
    if(typeof haystack[key] === 'object'){
      sliceObject(needle, haystack[key], found);
    }
  });
  if (found.length > 1) {
    throw 'More than one matching object.';
  }
  return found[0];
}

let getMallocChunkJson = (glibcVersion, versionsDir) => {
  /* TODO: this needs to be upgraded, currently it uses some knowledge about the malloc_chunk struct to operate */
  let output = {};
  let versionPath = path.join(defspath, glibcVersion);
  let chunkRawJson = JSON.parse(fs.readFileSync(path.join(versionPath, 'malloc_chunk.c.json'), { encoding: 'utf8' }));
  let sdl = sliceObject('struct_declaration_list', chunkRawJson);
  sdl.forEach((decl) => {
    let sql = decl.specifier_qualifier_list;
    let sdrl = decl.struct_declarator_list;
    if (sql.length > 1) {
      throw 'Unexpected multiple qualifier/specifiers.';
    }
    if (sdrl.length > 1)  {
      throw 'Unexpected multiple declarators.';
    }
    sql = sql[0];
    sdrl = sdrl[0];
    if ('typedef_name' in sql) {
      /* userdefined_type x | userdefined_type * x | userdefined_type x[8 * y] */
      let name = sliceObject('identifier', sdrl);
      output[name] = {
        size: ptrsize,
        count: 1
      }
    } else if ('struct_or_union_specifier' in sql) {
      /* struct something * x | struct something x */
      let indeclarator = sliceObject('declarator', sdrl)
      if ('pointer' in indeclarator) {
        /* Easy, we can use ptrsize */
        let name = sliceObject('identifier', indeclarator);
        output[name] = {
          size: ptrsize,
          count: 1
        }
        if (name === 'fd') {
          output['fd'].data = true;
        }
      } else {
        /* MUCH harder, we have something like struct malloc_chunk x[y]. We need to know the size of malloc_chunk. */
        throw 'Non-pointer struct.';
      }
    } else {
      /* for malloc_chunk we don't expect this. */
      throw 'Unexpected declarator.';
    }
  });
  return JSON.stringify(output, null, 2);
}

maps = {
  'int': (ptrsize == 8) ? ptrsize / 2 : ptrsize,
}

var deduceSize = (spec_qual_list, versionPath) => {
  //console.log('deducing size for ', spec_qual_list);
  var tdefs = gettypedefs.parse(fs.readFileSync(path.join(versionPath, 'malloc.c'), { encoding: 'utf8' }));
  var typeLib = {
    char: 1,
    'unsigned char': 1,
    'signed char': 1,
    int: ptrsize / 2,
    'unsigned int': (ptrsize == 8) ? ptrsize / 2 : ptrsize,
    short: (ptrsize == 8) ? ptrsize / 4 : ptrsize / 2,
    'unsigned short': (ptrsize == 8) ? ptrsize / 3 : ptrsize / 2,
    'long': ptrsize,
    'unsigned long': ptrsize,
    'INTERNAL_SIZE_T': ptrsize,
    'mutex_t': (ptrsize == 8) ? ptrsize / 2 : ptrsize,
    'size_t': ptrsize,
    'uint16_t': 2
  };
  tdefs.forEach((def) => {
    if (def.pointer) {
      typeLib[def.id] = ptrsize;
    } else {
      /* need to look up the typedef  but I'm not implementing this lol */
    }
  });
  
  return typeLib[spec_qual_list.map(sq => {
    if ('type_specifier' in sq) {
      return sq.type_specifier;
    } else if ('type_qualifier' in sq) {
      return '';
    } else if ('typedef_name' in sq) {
      return sq.typedef_name;
    } else {
      throw 'unable to find size of ' + JSON.stringify(spec_qual_list, null, 2) + ' in ' + JSON.stringify(typeLib, null, 2);
    }
  }).join(' ')]
}

let getMallocStateJson = (glibcVersion, versionsDir) => {
  /* TODO: right now this RELIES on the malloc_chunk being analyzed first. This is ok but it's done really shittily. */
  let output = {};
  let versionPath = path.join(defspath, glibcVersion);
  let stateRawJson = JSON.parse(fs.readFileSync(path.join(versionPath, 'malloc_state.c.json'), { encoding: 'utf8' }));

  let sdl = sliceObject('struct_declaration_list', stateRawJson);
  sdl.forEach((decl) => {
    /* Check for the mutex */
    let sql = decl.specifier_qualifier_list;
    let sdrl = decl.struct_declarator_list;
    if ('direct_declarator' in decl && 'identifier_list' in decl.direct_declarator && decl.direct_declarator.identifier_list.includes('mutex')) {
      output['mutex'] = {
        size: (ptrsize == 8) ? ptrsize / 2 : ptrsize,
        count: 1
      }
    } else {
      /* Not the mutex, so we need to handle the regular cases. */
      if (sdrl) {
        sdrl.forEach((dec) => {
          let declarator = dec.declarator;
          /* Iterate through each, however if we have > 1 we have something like:
           * long x, y, z; */
          if ('pointer' in declarator) {
            /* if we have a pointer in our declarator we MUST have ptrsize */
            output[sliceObject('identifier', declarator)] = {
              size: ptrsize,
              count: 1
            }
          } else if ('assignment_expression' in declarator) {
            /* We have a (probably, for our purposes) array. 
             * If we haven't deduced the size, make sure not null. If we have, we need to then deduce the type with the same method as keywords */
            output[sliceObject('identifier', declarator.direct_declarator)] = {
              size: deduceSize(sql, versionsDir),
              count: declarator.assignment_expression
            }
          } else {
            if ('direct_declarator' in declarator && 'assignment_expression' in declarator.direct_declarator) {
              output[sliceObject('identifier', declarator)] = {
                size: deduceSize(sql, versionsDir),
                count: declarator.direct_declarator.assignment_expression
              }

            } else {
              output[sliceObject('identifier', declarator)] = {
                size: deduceSize(sql, versionsDir),
                count: 1
              }
            }
          }
        });
      } else {
      }
    }
  });
  // let definesRawJson = JSON.parse(fs.readFileSync(path.join(versionPath, '
  return JSON.stringify(output, null, 2);
}

let getMallocParJson = (glibcVersion, versionsDir) => {
  /* TODO: right now this RELIES on the malloc_chunk being analyzed first. This is ok but it's done really shittily. */
  let output = {};
  let versionPath = path.join(defspath, glibcVersion);
  let stateRawJson = JSON.parse(fs.readFileSync(path.join(versionPath, 'malloc_par.c.json'), { encoding: 'utf8' }));

  let sdl = sliceObject('struct_declaration_list', stateRawJson);
  sdl.forEach((decl) => {
    /* Check for the mutex */
    let sql = decl.specifier_qualifier_list;
    let sdrl = decl.struct_declarator_list;
    if ('direct_declarator' in decl && 'identifier_list' in decl.direct_declarator && decl.direct_declarator.identifier_list.includes('mutex')) {
      output['mutex'] = {
        size: (ptrsize == 8) ? ptrsize / 2 : ptrsize,
        count: 1
      }
    } else {
      /* Not the mutex, so we need to handle the regular cases. */
      if (sdrl) {
        sdrl.forEach((dec) => {
          let declarator = dec.declarator;
          /* Iterate through each, however if we have > 1 we have something like:
           * long x, y, z; */
          if ('pointer' in declarator) {
            /* if we have a pointer in our declarator we MUST have ptrsize */
            output[sliceObject('identifier', declarator)] = {
              size: ptrsize,
              count: 1
            }
          } else if ('assignment_expression' in declarator) {
            /* We have a (probably, for our purposes) array. 
             * If we haven't deduced the size, make sure not null. If we have, we need to then deduce the type with the same method as keywords */
            output[sliceObject('identifier', declarator.direct_declarator)] = {
              size: deduceSize(sql, versionsDir),
              count: declarator.assignment_expression
            }
          } else {
            if ('direct_declarator' in declarator && 'assignment_expression' in declarator.direct_declarator) {
              output[sliceObject('identifier', declarator)] = {
                size: deduceSize(sql, versionsDir),
                count: declarator.direct_declarator.assignment_expression
              }

            } else {
              output[sliceObject('identifier', declarator)] = {
                size: deduceSize(sql, versionsDir),
                count: 1
              }
            }
          }
        });
      } else {
      }
    }
  });
  return JSON.stringify(output, null, 2);
}

let getTcachePerThreadJson = (glibcVersion, versionsDir) => {
  /* TODO: right now this RELIES on the malloc_chunk being analyzed first. This is ok but it's done really shittily. */
  let output = {};
  let versionPath = path.join(defspath, glibcVersion);
  let stateRawJson = JSON.parse(fs.readFileSync(path.join(versionPath, 'tcache_perthread_struct.c.json'), { encoding: 'utf8' }));

  let sdl = sliceObject('struct_declaration_list', stateRawJson);
  sdl.forEach((decl) => {
    /* Check for the mutex */
    let sql = decl.specifier_qualifier_list;
    let sdrl = decl.struct_declarator_list;
    if ('direct_declarator' in decl && 'identifier_list' in decl.direct_declarator && decl.direct_declarator.identifier_list.includes('mutex')) {
      output['mutex'] = {
        size: (ptrsize == 8) ? ptrsize / 2 : ptrsize,
        count: 1
      }
    } else {
      /* Not the mutex, so we need to handle the regular cases. */
      if (sdrl) {
        sdrl.forEach((dec) => {
          let declarator = dec.declarator;
          /* Iterate through each, however if we have > 1 we have something like:
           * long x, y, z; */
          if ('pointer' in declarator && 'direct_declarator' in declarator && 'assignment_expression' in declarator.direct_declarator) {
            /* struct something * x[y]; */
            output[sliceObject('identifier', declarator)] = {
              size: ptrsize,
              count: declarator.direct_declarator.assignment_expression
            }
          } else if ('pointer' in declarator) {
            /* if we have a pointer in our declarator we MUST have ptrsize */
            output[sliceObject('identifier', declarator)] = {
              size: ptrsize,
              count: 1
            }
          } else if ('pointer' in declarator && 'direct_declarator' in declarator && 'assignment_expression' in declarator.direct_declarator) {
            /* struct something * x[y]; */
            output[sliceObject('identifier', declarator)] = {
              size: ptrsize,
              count: declarator.direct_declarator.assignment_expression
            }
          } else if ('assignment_expression' in declarator) {
            /* We have a (probably, for our purposes) array. 
             * If we haven't deduced the size, make sure not null. If we have, we need to then deduce the type with the same method as keywords */
            output[sliceObject('identifier', declarator.direct_declarator)] = {
              size: deduceSize(sql, versionsDir),
              count: declarator.assignment_expression
            }
          } else if ('direct_declarator' in declarator && 'assignment_expression' in declarator.direct_declarator) {
              output[sliceObject('identifier', declarator)] = {
                size: deduceSize(sql, versionsDir),
                count: declarator.direct_declarator.assignment_expression
              }

          } else {
            output[sliceObject('identifier', declarator)] = {
              size: deduceSize(sql, versionsDir),
              count: 1
            }
          }
        });
      } else {
      }
    }
  });
  return JSON.stringify(output, null, 2);
}

let getTcacheEntryJson = (glibcVersion, versionsDir) => {
  /* TODO: right now this RELIES on the malloc_chunk being analyzed first. This is ok but it's done really shittily. */
  let output = {};
  let versionPath = path.join(defspath, glibcVersion);
  let stateRawJson = JSON.parse(fs.readFileSync(path.join(versionPath, 'tcache_entry.c.json'), { encoding: 'utf8' }));

  let sdl = sliceObject('struct_declaration_list', stateRawJson);
  sdl.forEach((decl) => {
    /* Check for the mutex */
    let sql = decl.specifier_qualifier_list;
    let sdrl = decl.struct_declarator_list;
    if ('direct_declarator' in decl && 'identifier_list' in decl.direct_declarator && decl.direct_declarator.identifier_list.includes('mutex')) {
      output['mutex'] = {
        size: (ptrsize == 8) ? ptrsize / 2 : ptrsize,
        count: 1
      }
    } else {
      /* Not the mutex, so we need to handle the regular cases. */
      if (sdrl) {
        sdrl.forEach((dec) => {
          let declarator = dec.declarator;
          /* Iterate through each, however if we have > 1 we have something like:
           * long x, y, z; */
          if ('pointer' in declarator) {
            /* if we have a pointer in our declarator we MUST have ptrsize */
            output[sliceObject('identifier', declarator)] = {
              size: ptrsize,
              count: 1
            }
          } else if ('assignment_expression' in declarator) {
            /* We have a (probably, for our purposes) array. 
             * If we haven't deduced the size, make sure not null. If we have, we need to then deduce the type with the same method as keywords */
            output[sliceObject('identifier', declarator.direct_declarator)] = {
              size: deduceSize(sql, versionsDir),
              count: declarator.assignment_expression
            }
          } else {
            if ('direct_declarator' in declarator && 'assignment_expression' in declarator.direct_declarator) {
              output[sliceObject('identifier', declarator)] = {
                size: deduceSize(sql, versionsDir),
                count: declarator.direct_declarator.assignment_expression
              }

            } else {
              output[sliceObject('identifier', declarator)] = {
                size: deduceSize(sql, versionsDir),
                count: 1
              }
            }
          }
        });
      } else {
      }
    }
  });
  return JSON.stringify(output, null, 2);
}

exports.main = (args) => {
  console.log(JSON.stringify(getMallocStateJson(args[1]), null, 2));
}

if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}

exports.getMallocChunkJson = getMallocChunkJson;
exports.getMallocStateJson = getMallocStateJson;
exports.getMallocParJson = getMallocParJson;
exports.getTcachePerThreadJson = getTcachePerThreadJson;
exports.getTcacheEntryJson = getTcacheEntryJson;
