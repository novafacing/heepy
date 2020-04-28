var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var middleware = require('socketio-wildcard')();
var fs = require('fs');
var path = require('path');
io.use(middleware);
const web = io.of("/web");
const gef = io.of("/gef");
var state = {
  groups: [
    {
      name: 'tcache',
      chunks: []
    },
    {
      name: 'fastbins',
      chunks: []
    },
    {
      name: 'unsorted',
      chunks: []
    },
    {
      name: 'small',
      chunks: []
    },
    {
      name: 'large',
      chunks: []
    },
    {
      name: 'free',
      chunks: []
    },
    {
      name: 'inUse',
      chunks: []
    }
  ]
};
var initialized = false;
/* Defaults, these are updated */
var glibcVersion = 2.31;
var ptrSize = 8;
var gMainArena = {};

server.listen(3000);


function initClient(numGroups) {
  // libcVersion / something else to help me init the number of groups with names of each for the network
  // Initialize network
}


function addNodeToClient(node) {
  // Adds node to client and stores in order state on server.
  web.emit('clear');
  web.emit('add-node', node);
}

function jsonToClient(jsonObject) {
  // Loop through lists
  for (let i = 0; i < jsonObject.groups.length; i++) {
    let name = jsonObject.groups[i].name;

    let prevAddress;
    // Loop through chunks
    for (let j = 0; j < jsonObject.groups[i].chunks.length; j++) {
      let label = "Address: " + jsonObject.groups[i].chunks[j].address + "\n";
      label += "Size: " + jsonObject.groups[i].chunks[j].size + "\n";
      label += "Left Size: " + jsonObject.groups[i].chunks[j].leftSize + "\n";
      label += "Previous: " + jsonObject.groups[i].chunks[j].prev + "\n";
      console.log(label);
      if(initialized === false) {
        console.log("Not initialized yet");
        return false;
      }
      web.emit("add-node", {
        id: jsonObject.groups[i].chunks[j].address,
        group: name,
        label: label
      });

      // Connect edges if not first chunk
      if(j !== 0) {
        web.emit("connect-nodes", {
          from: prev_address,
          to: jsonObject.groups[i].chunks[j].address
        });
      }

      prev_address = jsonObject.groups[i].chunks[j].address;
    }
  }
}

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "/index.html"));
});
app.get("/index.js", function(req, res) {
  res.sendFile(path.join(__dirname, "/index.js"));
});

// Calls to client
web.on("connection", function(socket) {
  console.log('Got connection from web');
  web.emit("client-hello", {
    connection: "success"
  });
});

function minChunkSize () {
  return offsetOf(mallocChunk(), 'fd_nextsize');
}

function minSize () {
  var constants = getStaticConstants();
  return (minChunkSize() + constants.malloc_align_mask & ~constants.malloc_align_mask)
}

function request2size (req) {
  var constants = getStaticConstants();
  return (((req) + constants.size_sz + constants.malloc_align_mask < minSize()) ? minSize() : ((req) + constants.size_sz + constants.malloc_align_mask) & ~malloc_align_mask)
}

function fastbin_index(sz) {
  var constants = getStaticConstants();
  return (((sz) >> (constants.size_sz == 8 ? 4 : 3)) - 2)
}

function getConstants () {
  var constants = getStaticConstants();
  // TODO: Make this the actual calculation 
  // constants.nfastbins = fastbin_index(constants.max_fast_size);
  constants.nfastbins = 10;
  return constants;
}

function getStaticConstants () {
  var size_sz = ptrSize;
  var max_fast_size = 80 * size_sz / 4;
  var malloc_alignment = 2 * size_sz;
  var malloc_align_mask = malloc_alignment - 1;
  var nbins = 128;
  var binmapshift = 5;
  var bitspermap = 1 << binmapshift;
  var binmapsize = nbins / bitspermap;
  return {
    'size_sz': size_sz,
    'max_fast_size': max_fast_size,
    'malloc_alignment': malloc_alignment,
    'malloc_align_mask': malloc_align_mask,
    'nbins': nbins,
    'binmapshift': binmapshift,
    'bitspermap': bitspermap,
    'binmapsize': binmapsize,
  }
}

function offsetOf(proto, field) {
  let offset = 0;
  for (let key in proto) {
    if (key === field) {
      return offset;
    }
    offset += proto.key.size * proto.key.count;
  }
  return offset;
}

function mallocChunk () {
  return {
    mchunk_prev_size: {
      size: ptrSize,
      count: 1
    },
    mchunk_size: {
      size: ptrSize,
      count: 1
    },
    fd: {
      size: ptrSize,
      count: 1
    },
    bk: {
      size: ptrSize,
      count: 1
    },
    fd_nextsize: {
      size: ptrSize,
      count: 1
    },
    bk_nextsize: {
      size: ptrSize,
      count: 1
    }
  };
}

function inUseMallocChunk(totalSize) {
  console.log('inuse chunk with size ', totalSize);
  return {
    mchunk_prev_size: {
      size: ptrSize,
      count: 1
    },
    mchunk_size: {
      size: ptrSize,
      count: 1
    },
    data: {
      size: totalSize - (2 * ptrSize),
      count: 1
    }
  };
}

function mallocState () {
  var constants = getConstants();
  return {
    mutex: {
      size: ptrSize / 2,
      count: 1
    },
    flags: {
      size: ptrSize / 2,
      count: 1
    },
    have_fastchunks: {
      size: ptrSize / 2,
      count: 1
    },
    fastbinsY: {
      size: ptrSize,
      count: constants.nfastbins
    },
    top: {
      size: ptrSize,
      count: 1
    },
    last_remainder: {
      size: ptrSize,
      count: 1
    },
    bins: {
      size: ptrSize,
      count: constants.nbins * 2 - 2
    },
    binmap: {
      size: ptrSize / 2,
      count: constants.binmapsize
    },
    next: {
      size: ptrSize,
      count: 1
    },
    next_free: {
      size: ptrSize,
      count: 1
    },
    attached_threads: {
      size: ptrSize,
      count: 1
    },
    system_mem: {
      size: ptrSize,
      count: 1
    },
    max_system_mem: {
      size: ptrSize,
      count: 1
    }

  };
}

function condense (addr, raw, prototype,...kwargs) {
  console.log('condense kw ', kwargs);
  let condensed = {};
  let loc = 0;
  switch(prototype) {
    case 'malloc_chunk':
      console.log('condensing ', raw, ' into ', mallocChunk());
      let chunk = mallocChunk();
      for (let member in chunk) {
        if (chunk[member].count > 1) {
          condensed[member] = [];
          for (var i = 0;  i < chunk[member].count; i++) {
            condensed[member].push(parseInt(changeEndianness(raw.slice(loc, loc + (chunk[member].size * 2))), 16));
            loc += chunk[member].size * 2;
          }
        } else {
          condensed[member] = parseInt(changeEndianness(raw.slice(loc, loc + (chunk[member].size * 2))), 16);
          loc += chunk[member].size * 2;
        }
      }
      return {
        addr: addr,
        data: condensed
      };
      break;
    case 'inuse_malloc_chunk':
      console.log('condensing ', raw, ' into ', inUseMallocChunk(kwargs[0]));
      let inuseChunk = inUseMallocChunk(kwargs[0]);
      for (let member in inuseChunk) {
        if (inuseChunk[member].count > 1) {
          condensed[member] = [];
          for (var i = 0;  i < inuseChunk[member].count; i++) {
            condensed[member].push(parseInt(changeEndianness(raw.slice(loc, loc + (inuseChunk[member].size * 2))), 16));
            loc += inuseChunk[member].size * 2;
          }
        } else if (member !== 'data') {
          condensed[member] = parseInt(changeEndianness(raw.slice(loc, loc + (inuseChunk[member].size * 2))), 16);
          loc += inuseChunk[member].size * 2;
        } else {
          condensed[member] = split(raw.slice(loc, loc + (inuseChunk[member].size * 2)), ptrSize);
          loc += inuseChunk[member].size * 2;

        }
      }
      return {
        addr: addr,
        data: condensed
      };
      break;
    case 'malloc_state':
      console.log('condensing ', raw, ' into ', mallocState());
      let state = mallocState()
      for (let member in state) {
        if (state[member].count > 1) {
          condensed[member] = [];
          for (var i = 0;  i < state[member].count; i++) {
            condensed[member].push(parseInt(changeEndianness(raw.slice(loc, loc + (state[member].size * 2))), 16));
            loc += state[member].size * 2;
          }
        } else {
          condensed[member] = parseInt(changeEndianness(raw.slice(loc, loc + (state[member].size * 2))), 16);
          loc += state[member].size * 2;
        }
      }
      return {
        addr: addr,
        data: condensed
      };
      break;
  }
}

function split (st, num) {
  if (!num || num < 1) throw Error('Segment length must be defined and greater than/equal to 1');
  const target = [];
  for (
      const array = Array.from(st);
      array.length;
      target.push(array.splice(0,num).join('')));
  return target;
}

function gefAction (sk, st, data) {
  console.log('Got heap change event with data ', data);
  switch(data['called-function']) {
    case 'malloc':
      malloc(sk, st, data);
      break;
    case 'calloc':
      calloc(sk, st, data);
      break;
    case 'realloc':
      realloc(sk, st, data);
      break;
    case 'free':
      free(sk, st, data);
      break;
  };
}

gef.on("connect", function(socket) {
  socket.on('*', function (data) {
    console.log('Got unknown callback with data ', data);
  });
  socket.on("heap_changed", (data) => {
    if (!initialized) {
      glibcVersion = getVersionNumber(socket).then((vnum) => {
        getPtrSize(socket).then((ptsize) => {
          getMainArenaAddr(socket).then((main_arena) => {
            getMainArenaSize(socket, main_arena).then((main_arena_size) => {
              getMainArenaContents(socket, main_arena, main_arena_size).then((main_arena_contents) => {
                glibcVersion = vnum;
                ptrSize = ptsize;
                gMainArena = condense(main_arena, main_arena_contents.slice(8), 'malloc_state');
                initialized = true;
                gefAction(socket, state, data);
              });
            });
          });
        });
      });
    } else {
      gefAction(socket, state, data);
    }
  });
  console.log('Got connection from gef');
  socket.emit('continue_execution');
});

function getPtrSize (socket) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject('No connection.');
    } else {
      socket.emit('sizeof', { var: '&main_arena' }, (data) => {
        resolve(data.result);
      });
    }
  });
}

function getMainArenaSize (socket) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject('No connection.');
    } else {
      socket.emit('sizeof', { var: 'main_arena' }, (data) => {
        resolve(data.result);
      });
    }
  });
}

function getMainArenaContents (socket, addr, size) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject('No connection.');
    } else {
      socket.emit('read_from_address', { address: addr, size: size }, (data) => {
        resolve(data.result);
      });
    }
  });
} 

function getMainArenaAddr (socket) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject('No connection.');
    } else {
      socket.emit('address_of_symbol', { symbol_name: 'main_arena' }, (data) => {
        resolve(data.result);
      });
    }
  });
}

function getVersionNumber (socket) {
  /* call the version number emit */
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject('No connection.');
    } else {
      socket.emit('libc_version', (data) => {
        resolve(data.result);
      });
    }
  });
}

const changeEndianness = (string) => {
  const result = [];
  let len = string.length - 2;
  while (len >= 0) {
    result.push(string.substr(len, 2));
    len -= 2;
  }
  return result.join('');
}

const roundAlloc = (req) => {
}

function getAllocSize (sk, retAddr) {
  /* Where retAddr is the addr returned from malloc */
  return new Promise(resolve => {
    sk.emit('read_from_address', { size: ptrSize, address: retAddr }, (data) => {
      /* Callback for addr read  */
      resolve(parseInt((changeEndianness(data.result) >> 1) << 1, 16));
    });
  });
}

function getContentsAt (sk, addr, size) {
  console.log('getting read_from_address with addr ', addr, ' size ', size);
  return new Promise(resolve => {
    sk.emit('read_from_address', { size: size, address: addr }, (data) => {
      resolve(data.result);
    });
  });
}

function malloc (sk, st, data) {
  console.log('Got malloc');
  var retAddr = data['rax-after-call'];
  console.log('got addr ', retAddr);
  getAllocSize(sk, retAddr - ptrSize).then((allocSize) => {
    getContentsAt(sk, retAddr - (2 * ptrSize), allocSize).then((contents) => {
      var inUseGroup = state.groups.find(g => g.name == 'inUse')
      inUseGroup.chunks.push(condense(retAddr, contents, 'inuse_malloc_chunk', allocSize));
      console.log(inUseGroup.chunks[inUseGroup.chunks.length - 1].data);
      addNodeToClient({
        id: inUseGroup.chunks[inUseGroup.chunks.length - 1].addr,
        group: 'inUse',
        label: JSON.stringify(inUseGroup.chunks[inUseGroup.chunks.length - 1], null, 2)
      });
  });
}

function calloc (sk, st, data) {
}
function realloc (sk, st, data) {
}
function free (sk, st, data) {
  console.log('got free');
  var freedAddr = data['rdi-before-call'];

}


/* gef-side events */


