const path = require('path')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs')
const cliProgress = require('cli-progress')
const shell = require('shelljs')
const alloxtract = require('./alloxtract')
const process = require('process')

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

    if (!fs.existsSync(versionsDir)) {
      fs.mkdirSync(versionsDir)
    }
    if (!fs.existsSync(path.join(versionsDir, extractVersionNumber(release)))) {
      fs.mkdirSync(path.join(versionsDir, extractVersionNumber(release)))
    }
    console.log('Getting glibc definitions for ', release)
    fs.writeFileSync(path.join(versionsDir, extractVersionNumber(release), 'malloc' + '.c'), versionDef['malloc'])
    for (var def in versionDef) {
      /*TODO:  Feed the parser our struct and output JSON from it */
      fs.writeFileSync(path.join(versionsDir, extractVersionNumber(release), def + '.c'), versionDef[def])
      if (def !== 'malloc') {
        var structJson = alloxtract.generateJson(versionDef[def], versionDef['malloc']);
        var jsonDef = JSON.stringify(structJson, null, 2);
        fs.writeFileSync(path.join(versionsDir, extractVersionNumber(release), def + '.c.json'), jsonDef);
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
