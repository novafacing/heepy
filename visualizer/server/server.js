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
    }
  ]
};
var initialized = false;
/* Defaults, these are updated */
var glibcVersion = 2.31;
var ptrSize = 8;

server.listen(3000);


function initClient(numGroups) {
  // libcVersion / something else to help me init the number of groups with names of each for the network
  // Initialize network
}

var jsonStub = {
  version: "0.1",
  groups: [
    {
      name: "tcache",
      chunks: [
        {
          address: "0x00",
          size: "0x20",
          leftSize: "0x4",
          prev: "0x00"
        },
        {
          address: "0x100",
          size: "0x20",
          leftSize: "0x8",
          prev: "0x00"
        }
      ]
    },
    {
      name: "free",
      chunks: [
        {
          address: "0x20",
          size: "0x80",
          leftSize: "0x00",
          prev: "0x00"
        },
        {
          address: "0x800",
          size: "0x800",
          leftSize: "0x80",
          prev: "0x00"
        }
      ]
    }
  ]
};

function jsonToClient(jsonObject) {
  // Loop through lists
  for (let i = 0; i < jsonObject.groups.length; i++) {
    let name = jsonObject.groups[i].name;
    // TODO: add name and color to key? red (3): in use, green (4): free

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
// Calls json to client with 'initial' heap structure
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
  constants.nfastbins = fastbin_index(constants.max_fast_size);
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

function mallocState () {
  var constants = getConstants();
  return {
    mutex: {
      size: ptrSize / 2,
      count: 1
    },
    flags: {
      size: ptrSize,
      count: 1
    },
    have_fastchunks: {
      size: ptrSize,
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
      size: ptrSize,
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

function condense (raw, prototype) {
  console.log('condensing ', raw, ' into ', prototype);
  let condensed = {};
  let loc = 0;
  switch(prototype) {
    case 'malloc_chunk':
      let chunk = mallocChunk();
      for (let member in chunk) {
        condensed[member] = raw.slice(loc, loc + (chunk[member].size * chunk[member].count));
        loc += chunk[member].size * chunk[member].count;
      }
      return condensed;
      break;
    case 'malloc_state':
      let state = mallocState()
      for (let member in state) {
        condensed[member] = raw.slice(loc, loc + (state[member].size * state[member].count));
        loc += state[member].size * state[member].count;
      }
      return condensed;
      break;
  }
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
                state = condense(changeEndianness(main_arena_contents), 'malloc_state');
                console.log('Got state ', state);
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
      resolve(data);
    });
  });
}

function malloc (sk, st, data) {
  console.log('Got malloc');
  var retAddr = data['rax-after-call'];
  console.log('got addr ', retAddr);
  getAllocSize(sk, retAddr - ptrSize).then((allocSize) => {
    getContentsAt(sk, retAddr - (2 * ptrSize), allocSize).then((contents) => {
      return {
        addr: retAddr - (2 * ptrSize),
        contents: contents
      };
    });
  });
}

function calloc (sk, st, data) {
}
function realloc (sk, st, data) {
}
function free (sk, st, data) {
}


/* gef-side events */


