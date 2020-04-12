const path = require('path')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs')
const cliProgress = require('cli-progress')
const nearley = require('nearley')
const grammar = require('./cjs/grammar.js')
const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar))

const dir = path.join(__dirname, 'glibc')
async function getRepo () {
  if (!fs.existsSync(dir)) {
    console.log('Cloning glibc repo. This will take a while...')
    /* We don't have glibc source, need to get it */
    const multibar = new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true
    }, cliProgress.Presets.legacy)
    var bars = {}
    await git.clone({
      fs,
      http,
      dir,
      corsProxy: 'https://cors.isomorphic-git.org',
      url: 'https://github.com/bminor/glibc.git',
      onProgress: event => {
        if (!(event.phase in bars)) {
          bars[event.phase] = multibar.create(event.total ? event.total : 0, 0)
          bars[event.phase].format = '> ' + event.phase + ' [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
        }
        if (event.total) {
          bars[event.phase].setTotal(event.total)
        } else {
          bars[event.phase].setTotal(event.loaded)
        }
        bars[event.phase].update(event.loaded, { filename: event.phase })
      }
    }).then(() => {
      multibar.stop()
      console.log()
      console.log('Retrieved glibc source...')
    })
  }
  /* We have glibc source, do a fetch to make sure we have updates */
  const multibar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true
  }, cliProgress.Presets.legacy)
  bars = {}
  await git.fetch({
    fs,
    http,
    dir,
    corsProxy: 'https://cors.isomorphic-git.org',
    onProgress: event => {
      if (!(event.phase in bars)) {
        bars[event.phase] = multibar.create(event.total ? event.total : 0, 0)
        bars[event.phase].format = '> ' + event.phase + ' [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
      }
      if (event.total) {
        bars[event.phase].setTotal(event.total)
      } else {
        bars[event.phase].setTotal(event.loaded)
      }
      bars[event.phase].update(event.loaded, { filename: event.phase })
    }
  }).then(() => {
    multibar.stop()
    console.log()
    console.log('Finished fetch...')
  })
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
      jsonDefs[def] = mallocC.substring(pos, findMatchIndex(mallocC, startStruct + match.length - 1) + 1)
    }
  })
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
    for (var def in versionDef) {
      // fs.writeFileSync(path.join(versionsDir, extractVersionNumber(release), def + '.type'), parser.feed(versionDef[def]))
      console.log(parser.feed(versionDef[def]))
    }
    console.log('Got definitions for glibc ', release)
  })
}

getRepo().catch(e => { console.error(e) })
  .then(getReleases().catch(e => { console.error(e) }).then((releases) => {
    releases.forEach((release) => {
      getVersionMallocSource(release)
    })
  }))