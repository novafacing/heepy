const nearley = require('nearley')
const grammar = require('./grammar.js')
const process = require('process')
const fs = require('fs')

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar))
var argv = process.argv.slice(2)

var contents = fs.readFileSync(argv[0], { encoding: 'utf8' })

console.log(parser.feed(contents))
