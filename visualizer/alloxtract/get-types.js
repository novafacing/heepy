const path = require('path')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs')
const cliProgress = require('cli-progress')
const shell = require('shelljs')
const alloxtract = require('./alloxtract')
const process = require('process')
const post = require('./post.js')
const arch = require('arch');
var ptrsize = (arch() === 'x86') ? 4 : 8;

const dir = path.join(__dirname, 'glibc')

function getRepo () {
  if (!fs.existsSync(dir)) {
    shell.exec('git clone https://github.com/bminor/glibc.git')
    console.log('Obtained glibc source...')
  }
}

async function getReleases () {
  var branches = await git.listBranches({
    fs,
    dir,
    remote: 'origin'
  })
  // eslint-disable-next-line
  var re = new RegExp('^release\/[0-9]\.[0-9]+\/master$')
  return branches.filter((branch) => branch.match(re))
}

function findMatchIndex (str, startPos) {
  if (str[startPos] !== '{') {
    return -1
  }
  var level = 1
  for (var index = startPos + 1; index < str.length; index++) {
    if (str[index] === '{') {
      level++
    } else if (str[index] === '}') {
      level--
    }
    if (level === 0) {
      return index
    }
  }
  return -1
}

/* Structures we care about:
 * malloc_chunk
 * malloc_state
 * malloc_par
 * tcache_entry
 * tcache_perthread_struct
 */
function buildDef (mallocDir) {
  const mallocC = fs.readFileSync(path.join(mallocDir, 'malloc.c'), { encoding: 'ascii' })
  var jsonDefs = {}
  Array.prototype.forEach.call([
    'malloc_chunk',
    'malloc_state',
    'malloc_par',
    'tcache_entry',
    'tcache_perthread_struct'
  ], (def) => {
    var re = new RegExp('struct ' + def + '[\t\r\n ]{')
    var pos = mallocC.search(re)
    var match = mallocC.match(re)
    if (match) {
      match = match[0]
    }
    var startStruct = -1
    if (match) {
      startStruct = pos // + match.length + 1
    }
    if (pos !== -1 && startStruct !== -1) {
      // jsonDefs[def] = mallocC.substring(pos, findMatchIndex(mallocC, startStruct))
      jsonDefs[def] = mallocC.substring(pos, findMatchIndex(mallocC, startStruct + match.length - 1) + 1) + ';'
    }
  })
  jsonDefs['malloc'] = mallocC
  return jsonDefs
}

function extractVersionNumber (release) {
  return release.split('/')[1]
}

function sliceObject(obj, key) {
  var value;
    Object.keys(object).some(function(k) {
        if (k === key) {
            value = object[k];
            return true;
        }
        if (object[k] && typeof object[k] === 'object') {
            value = findVal(object[k], key);
            return value !== undefined;
        }
    });
    return value;
}

function flattenMallocStruct(structure, defines) {
  var sdl = sliceObject(structure, 'struct_declaration_list');
  var flatStruct = {};
  for (var decl in sdl) {
  }
}

var freeToInuseMalloc = (structure) => {
  structure = JSON.parse(structure);
  let freechunk = {};
  let atdata = false;
  let datasize = 0;
  let lastoffset = 0;
  for (prop in structure) {
    if ('data' in structure[prop]) {
      atdata = true;
    }
    if (atdata) {
      datasize += structure[prop].size * structure[prop].count;
    }
    if (!atdata) {
      freechunk[prop] = structure[prop];
      lastoffset = freechunk[prop].offset;
    }
  }
  freechunk.data = {
    size: datasize,
    count: 1,
    offset: lastoffset + ptrsize
  }
  return JSON.stringify(freechunk, null, 2);
}

var addOffs = (structure) => {
  structure = JSON.parse(structure);
  for (prop in structure) {
    structure[prop].offset = offsetOf(structure, prop);
  }
  return JSON.stringify(structure, null, 2);
}

var offsetOf = (structure, name) => {
    var offset = 0;
    for (prop in structure) {
        if (prop === name) {
            return offset;
        }
        offset += structure[prop].size * structure[prop].count;
    }
    return offset;
}

async function getVersionMallocSource (release) {
  /* Check out release branch */
  await git.checkout({
    fs,
    http,
    dir,
    ref: release,
    force: true,
    filepaths: ['malloc']
  }).then(() => {
    var versionDef = buildDef(path.join(dir, 'malloc'))
    var versionsDir = path.join(__dirname, 'defs')
    var finalJsonsDir = path.join(__dirname, 'structs')

    if (!fs.existsSync(versionsDir)) {
      fs.mkdirSync(versionsDir)
    }
    if (!fs.existsSync(finalJsonsDir)) {
      fs.mkdirSync(finalJsonsDir);
    }
    if (!fs.existsSync(path.join(versionsDir, extractVersionNumber(release)))) {
      fs.mkdirSync(path.join(versionsDir, extractVersionNumber(release)))
    }
    if (!fs.existsSync(path.join(finalJsonsDir, extractVersionNumber(release)))) {
      fs.mkdirSync(path.join(finalJsonsDir, extractVersionNumber(release)))
    }
    console.log('Getting glibc definitions for ', release)
    fs.writeFileSync(path.join(versionsDir, extractVersionNumber(release), 'malloc' + '.c'), versionDef['malloc'])
    for (var def in versionDef) {
      /*TODO:  Feed the parser our struct and output JSON from it */
      fs.writeFileSync(path.join(versionsDir, extractVersionNumber(release), def + '.c'), versionDef[def])
      if (def !== 'malloc') {
        var structJson = alloxtract.generateJson(versionDef[def], versionDef['malloc'], extractVersionNumber(release));
        var jsonDef = JSON.stringify(structJson.struct, null, 2);
        var defines = JSON.stringify(structJson.defs, null, 2);
        fs.writeFileSync(path.join(versionsDir, extractVersionNumber(release), def + '.c.json'), jsonDef);
        fs.writeFileSync(path.join(versionsDir, extractVersionNumber(release), def + '.defines.json'), defines);
        //var hrStructure = flattenMallocStruct(jsonDef, defines);
        let structure = undefined;
        switch(def) {
          case 'malloc_chunk':
            structure = addOffs(post.getMallocChunkJson(extractVersionNumber(release), versionsDir));
            fs.writeFileSync(path.join(finalJsonsDir, extractVersionNumber(release), def + '.json'), structure);
            structure = freeToInuseMalloc(structure);
            fs.writeFileSync(path.join(finalJsonsDir, extractVersionNumber(release), def + '_inuse' + '.json'), structure);
            break;
          case 'malloc_state':
            structure = addOffs(post.getMallocStateJson(extractVersionNumber(release), path.join(versionsDir, extractVersionNumber(release))));
            fs.writeFileSync(path.join(finalJsonsDir, extractVersionNumber(release), def + '.json'), structure);
            break;
          case 'malloc_par':
            structure = addOffs(post.getMallocParJson(extractVersionNumber(release), path.join(versionsDir, extractVersionNumber(release))));
            fs.writeFileSync(path.join(finalJsonsDir, extractVersionNumber(release), def + '.json'), structure);
            break;
          case 'tcache_perthread_struct':
            structure = addOffs(post.getTcachePerThreadJson(extractVersionNumber(release), path.join(versionsDir, extractVersionNumber(release))));
            fs.writeFileSync(path.join(finalJsonsDir, extractVersionNumber(release), def + '.json'), structure);
            break;
          case 'tcache_entry':
            structure = addOffs(post.getTcacheEntryJson(extractVersionNumber(release), path.join(versionsDir, extractVersionNumber(release))));
            fs.writeFileSync(path.join(finalJsonsDir, extractVersionNumber(release), def + '.json'), structure);
            break;
        }
      }
    }
  })
}

getRepo()
getReleases().catch(e => { console.error(e) }).then((releases) => {
  releases.forEach((release) => {
    getVersionMallocSource(release)
  })
})
