# Alloxtract

Disclaimer: I am not a compiler expert. I only was able to get this far because I run the linter for CS240/CS252. This is horrible code. It is not a single pass. In fact it is I think 6 passes. That's not great but it does what I need it to do. This code parses glibc source code and outputs JSON structures for all of the malloc structures:

- malloc_chunk (and malloc_chunk_inuse)
- malloc_state
- malloc_par
- tcache_entry
- tcache_perthread_struct

These are parsed and analyzed and some other fun stuff and out pops a json like this:

```json

{
  "mutex": {
    "size": 4,
    "count": 1,
    "offset": 0
  },
  "flags": {
    "size": 4,
    "count": 1,
    "offset": 4
  },
  "have_fastchunks": {
    "size": 4,
    "count": 1,
    "offset": 8
  },
  "fastbinsY": {
    "size": 8,
    "count": 10,
    "offset": 12
  },
  "top": {
    "size": 8,
    "count": 1,
    "offset": 92
  },
  "last_remainder": {
    "size": 8,
    "count": 1,
    "offset": 100
  },
  "bins": {
    "size": 8,
    "count": 254,
    "offset": 108
  },
  "binmap": {
    "size": 4,
    "count": 4,
    "offset": 2140
  },
  "next": {
    "size": 8,
    "count": 1,
    "offset": 2156
  },
  "next_free": {
    "size": 8,
    "count": 1,
    "offset": 2164
  },
  "attached_threads": {
    "size": 8,
    "count": 1,
    "offset": 2172
  },
  "system_mem": {
    "size": 8,
    "count": 1,
    "offset": 2180
  },
  "max_system_mem": {
    "size": 8,
    "count": 1,
    "offset": 2188
  }
}

```

Yay!

## Installing

Install the dependencies (there aren't many but we do need them :)

`npm run install`

## Building

The below will build the parsers from the grammars.

`npm run build`

## Running

This will create some directories. First, it will clone glibc to your machine. This is NOT a fast process! 

Then, it will go through every release branch of glibc and grab what it needs. Then, it'll go through each of those release grabs and parse malloc.c. Note, there is some type deduction and define assumption made here. If sizes of things are wrong, this is a likely place. Finally, it does a last pass on the AST of the c-language structures output by the c11 parser and converts them (this part is kind of hacky) to the yummy JSON above. These are output to `./structs/< glibc-version >/struct.json`

`npm run run`

