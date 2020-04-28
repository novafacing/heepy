var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var middleware = require("socketio-wildcard")();
var fs = require("fs");
var path = require("path");
io.use(middleware);
const web = io.of("/web");
const gef = io.of("/gef");

function redraw () {
  console.log('redrawing');
  web.emit('clear');
  for (var group in state.groups) {
    group = state.groups[group];
    console.log(group);
    if (group.name === 'inUse') {
      for (var chunk in group.chunks) {
        addNodeToClient(group.chunks[chunk]);
      }
    }
    if (group.name === 'tcache') {
      for (var chunk in group.chunks) {
        addNodeToClient(group.chunks[chunk]);
      }
    }
  }
}

var state = {
  groups: [
    {
      name: "tcache",
      chunks: []
    },
    {
      name: "fastbins",
      chunks: []
    },
    {
      name: "unsorted",
      chunks: []
    },
    {
      name: "small",
      chunks: []
    },
    {
      name: "large",
      chunks: []
    },
    {
      name: "free",
      chunks: []
    },
    {
      name: "inUse",
      chunks: []
    }
  ]
};

// Ordered state of client
var clientState = {
  groups: [
    {
      name: "tcache",
      chunks: []
    },
    {
      name: "fastbins",
      chunks: []
    },
    {
      name: "unsorted",
      chunks: []
    },
    {
      name: "small",
      chunks: []
    },
    {
      name: "large",
      chunks: []
    },
    {
      name: "free",
      chunks: []
    },
    {
      name: "inUse",
      chunks: []
    }
  ]
};

var initialized = false;
/* Defaults, these are updated */
var glibcVersion = 2.31;
var ptrSize = 8;
var gMainArena = {};
var gTcache = {};

server.listen(3000);

function initClient(numGroups) {
  // libcVersion / something else to help me init the number of groups with names of each for the network
  // Initialize network
}

function addNodeToClient(node) {
  // Adds node to client and stores in order state on server.
  // node is an object in the form:
  // {
  //  id: "0x00",
  //  group: "inUse",
  //  label: "prev: 100\n..."
  // }
  // Check argument same as an assert
  if(!node.hasOwnProperty('id') || !node.hasOwnProperty('group') || !node.hasOwnProperty('label')){
    console.log('Invalid call to addNodeToClient, missing id, group, or label');
    return;
  }
  // TODO remove after testing
  console.log(
    "addNodeToClient() id:",
    typeof node.id,
    node.id,
    "group:",
    typeof node.group,
    node.group,
    "label:",
    typeof node.label,
    node.label
  );

  // Add to clientState
  // 3 cases
  // 1: no neighbors, can just add and be done
  // 2: 1 neighbor, add node and connect the two
  // 3: 2 neighbors, disconnect neighbors, add new node, connect left to new node, connect right to new node

  // Find correct group
  let groupIndex = 0;
  for (; groupIndex < clientState.groups.length; groupIndex++) {
    if (clientState.groups[groupIndex].name === node.group) break;
  }

  // Empty group case
  if (clientState.groups[groupIndex].chunks.length === 0) {
    // Add node to client state
    clientState.groups[groupIndex].chunks.push(node);
    // Add node to client
    web.emit("add-node", node);
    return;
  }

  // Non empty group
  // Loop through group and check addresses
  // nodeIndex is the index that the node is being inserted to
  let nodeIndex = 0;
  for (
    ;
    nodeIndex < clientState.groups[groupIndex].chunks.length;
    nodeIndex++
  ) {
    // Break if current address is larger than address to be inserted
    if (
      parseInt(clientState.groups[groupIndex].chunks[nodeIndex], 16) >
      parseInt(node.address, 16)
    )
      break;
  }

  // Check case 2 if nodeIndex is first or last of list
  console.log("Final nodeIndex: ", nodeIndex);
  if (nodeIndex === 0) {
    // Insert at head and add connection from node to old head
    clientState.groups[groupIndex].chunks.splice(0, 0, node);
    web.emit("add-node", node);
    web.emit(
      "connect-nodes",
      node.id,
      clientState.groups[groupIndex].chunks[1].id
    );
    return;
  } else if (nodeIndex === clientState.groups[groupIndex].chunks.length) {
    // TODO: check if this is length or length - 1
    // Insert at tail and add connection from old tail to node
    clientState.groups[groupIndex].chunks.push(node);
    web.emit("add-node", node);
    web.emit(
      "connect-nodes",
      clientState.groups[groupIndex].chunks[
        clientState.groups[groupIndex].chunks.length - 2
      ].id,
      node.id
    );
    return;
  }

  // Case 3 2 neighbors
  // Disconnect groups[nodeIndex-1] groups[nodeIndex]
  // Save ids for later
  let prev = clientState.groups[groupIndex].chunks[nodeIndex - 1];
  let next = clientState.groups[groupIndex].chunks[nodeIndex];
  web.emit("disconnect-nodes", prev.id, next.id);

  // Add new node
  clientState.groups[groupIndex].chunks.splice(nodeIndex, 0, node);
  web.emit("add-node", node);
  web.emit("connect-nodes", prev.id, node.id);
  web.emit("connect-nodes", node.id, next.id);

  // web.emit('clear');
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
      if (initialized === false) {
        console.log("Not initialized yet");
        return false;
      }
      web.emit("add-node", {
        id: jsonObject.groups[i].chunks[j].address,
        group: name,
        label: label
      });

      // Connect edges if not first chunk
      if (j !== 0) {
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
  console.log("Got connection from web");
  web.emit("client-hello", {
    connection: "success"
  });
});

function minChunkSize() {
  return offsetOf(mallocChunk(), "fd_nextsize");
}

function minSize() {
  var constants = getStaticConstants();
  return (
    (minChunkSize() + constants.malloc_align_mask) &
    ~constants.malloc_align_mask
  );
}

function request2size(req) {
  var constants = getStaticConstants();
  return req + constants.size_sz + constants.malloc_align_mask < minSize()
    ? minSize()
    : (req + constants.size_sz + constants.malloc_align_mask) &
        ~malloc_align_mask;
}

function fastbin_index(sz) {
  var constants = getStaticConstants();
  return (sz >> (constants.size_sz == 8 ? 4 : 3)) - 2;
}

function getConstants() {
  var constants = getStaticConstants();
  // TODO: Make this the actual calculation
  // constants.nfastbins = fastbin_index(constants.max_fast_size);
  constants.nfastbins = 10;
  constants.tcache_max_bins = 64;
  return constants;
}

function getStaticConstants() {
  var size_sz = ptrSize;
  var max_fast_size = (80 * size_sz) / 4;
  var malloc_alignment = 2 * size_sz;
  var malloc_align_mask = malloc_alignment - 1;
  var nbins = 128;
  var binmapshift = 5;
  var bitspermap = 1 << binmapshift;
  var binmapsize = nbins / bitspermap;
  return {
    size_sz: size_sz,
    max_fast_size: max_fast_size,
    malloc_alignment: malloc_alignment,
    malloc_align_mask: malloc_align_mask,
    nbins: nbins,
    binmapshift: binmapshift,
    bitspermap: bitspermap,
    binmapsize: binmapsize
  };
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

function tcacheBins () {
  return {
    bins: {
      size: ptrSize,
      count: getConstants().tcache_max_bins
    }
  }
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
  console.log("inuse chunk with size ", totalSize);
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
      size: totalSize - 2 * ptrSize,
      count: 1
    }
  };
}

function mallocState() {
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

function condense(addr, raw, prototype, ...kwargs) {
  console.log("condense kw ", kwargs);
  let condensed = {};
  let loc = 0;
  switch (prototype) {
    case "malloc_chunk":
      console.log("condensing ", raw, " into ", mallocChunk());
      let chunk = mallocChunk();
      for (let member in chunk) {
        if (chunk[member].count > 1) {
          condensed[member] = [];
          for (var i = 0; i < chunk[member].count; i++) {
            condensed[member].push(
              parseInt(
                changeEndianness(raw.slice(loc, loc + chunk[member].size * 2)),
                16
              )
            );
            loc += chunk[member].size * 2;
          }
        } else {
          condensed[member] = parseInt(
            changeEndianness(raw.slice(loc, loc + chunk[member].size * 2)),
            16
          );
          loc += chunk[member].size * 2;
        }
      }
      return {
        addr: addr,
        data: condensed
      };
      break;
    case "inuse_malloc_chunk":
      console.log("condensing ", raw, " into ", inUseMallocChunk(kwargs[0]));
      let inuseChunk = inUseMallocChunk(kwargs[0]);
      for (let member in inuseChunk) {
        if (inuseChunk[member].count > 1) {
          condensed[member] = [];
          for (var i = 0; i < inuseChunk[member].count; i++) {
            condensed[member].push(
              parseInt(
                changeEndianness(
                  raw.slice(loc, loc + inuseChunk[member].size * 2)
                ),
                16
              )
            );
            loc += inuseChunk[member].size * 2;
          }
        } else if (member !== "data") {
          condensed[member] = parseInt(
            changeEndianness(raw.slice(loc, loc + inuseChunk[member].size * 2)),
            16
          );
          loc += inuseChunk[member].size * 2;
        } else {
          condensed[member] = split(
            raw.slice(loc, loc + inuseChunk[member].size * 2),
            ptrSize
          );
          loc += inuseChunk[member].size * 2;
        }
      }
      return {
        addr: addr,
        data: condensed
      };
      break;
    case "malloc_state":
      console.log("condensing ", raw, " into ", mallocState());
      let state = mallocState();
      for (let member in state) {
        if (state[member].count > 1) {
          condensed[member] = [];
          for (var i = 0; i < state[member].count; i++) {
            condensed[member].push(
              parseInt(
                changeEndianness(raw.slice(loc, loc + state[member].size * 2)),
                16
              )
            );
            loc += state[member].size * 2;
          }
        } else {
          condensed[member] = parseInt(
            changeEndianness(raw.slice(loc, loc + state[member].size * 2)),
            16
          );
          loc += state[member].size * 2;
        }
      }
      return {
        addr: addr,
        data: condensed
      };
      break;
    case 'tcache_bins':
      console.log('condensing ', raw, ' into ', tcacheBins());
      let cacheBins = tcacheBins();
      for (let member in cacheBins) {
        if (cacheBins[member].count > 1) {
          condensed[member] = [];
          for (var i = 0;  i < cacheBins[member].count; i++) {
            condensed[member].push(parseInt(changeEndianness(raw.slice(loc, loc + (cacheBins[member].size * 2))), 16));
            loc += cacheBins[member].size * 2;
          }
        } else {
          condensed[member] = parseInt(changeEndianness(raw.slice(loc, loc + (cacheBins[member].size * 2))), 16);
          loc += cacheBins[member].size * 2;
        }
      }
      return {
        addr: addr,
        data: condensed
      };
      break;
  }
}

function split(st, num) {
  if (!num || num < 1)
    throw Error("Segment length must be defined and greater than/equal to 1");
  const target = [];
  for (
    const array = Array.from(st);
    array.length;
    target.push(array.splice(0, num).join(""))
  );
  return target;
}

function gefAction(sk, st, data) {
  console.log("Got heap change event with data ", data);
  switch (data["called-function"]) {
    case "malloc":
      malloc(sk, st, data);
      break;
    case "calloc":
      calloc(sk, st, data);
      break;
    case "realloc":
      realloc(sk, st, data);
      break;
    case "free":
      free(sk, st, data);
      break;
  }
}

gef.on("connect", function(socket) {
  socket.on("*", function(data) {
    console.log("Got unknown callback with data ", data);
  });
  socket.on("heap_changed", data => {
    if (!initialized) {
      glibcVersion = getVersionNumber(socket).then(vnum => {
        getPtrSize(socket).then(ptsize => {
          getMainArenaAddr(socket).then(main_arena => {
            getMainArenaSize(socket, main_arena).then(main_arena_size => {
              getMainArenaContents(socket, main_arena, main_arena_size).then(
                main_arena_contents => {
                  glibcVersion = vnum;
                  ptrSize = ptsize;
                  gMainArena = condense(
                    main_arena,
                    main_arena_contents.slice(8),
                    "malloc_state"
                  );
                  initialized = true;
                  gefAction(socket, state, data);
                }
              );
            });
          });
        });
      });
    } else {
      gefAction(socket, state, data);
    }
  });
  console.log("Got connection from gef");
  socket.emit("continue_execution");
});

function getPtrSize(socket) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject("No connection.");
    } else {
      socket.emit("sizeof", { var: "&main_arena" }, data => {
        resolve(data.result);
      });
    }
  });
}

function getMainArenaSize(socket) {
  return new Promise((resolve, reject) => {
    resolve(2200);
    /*
    // TODO: Make real
    if (!socket) {
      reject("No connection.");
    } else {
      socket.emit('sizeof', { var: 'main_arena' }, (data) => {
        resolve(data.result);
      });
    }
    */
  });
}

function getHeapBase (socket) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject('No connection.');
    } else {
      socket.emit('address_of_symbol', { symbol_name: 'mp_->sbrk_base' }, (data) => {
        console.log('addr of heap base ', data.result.toString(16));
        resolve(data.result);
      });
    }
  });
}

function getTcacheBins (socket, addr) {
  var tcache_addr = addr + (2 * ptrSize) + getConstants().tcache_max_bins;
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject('No connection.');
    } else {
      socket.emit('read_from_address', { address: tcache_addr, size: ptrSize * getConstants().tcache_max_bins }, (data) => {
        resolve(data.result);
      });
    }
  });
}

function getMainArenaContents(socket, addr, size) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject("No connection.");
    } else {
      socket.emit("read_from_address", { address: addr, size: size }, data => {
        resolve(data.result);
      });
    }
  });
}

function getMainArenaAddr(socket) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject("No connection.");
    } else {
      socket.emit("address_of_symbol", { symbol_name: "main_arena" }, data => {
        resolve(data.result);
      });
    }
  });
}

function derefAddr (sk, addr) {
  return new Promise((resolve, reject) => {
    if (!sk) {
      reject('No connection.');
    } else {
      sk.emit('read_from_address', { address: addr, size: ptrSize }, (data) => {
        resolve(parseInt(changeEndianness(data.result), 16));
      });
    }
  });
} 


function getVersionNumber (socket) {
  /* call the version number emit */
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject("No connection.");
    } else {
      socket.emit("libc_version", data => {
        resolve(data.result);
      });
    }
  });
}

const changeEndianness = string => {
  const result = [];
  let len = string.length - 2;
  while (len >= 0) {
    result.push(string.substr(len, 2));
    len -= 2;
  }
  return result.join("");
};

const roundAlloc = req => {};

function getAllocSize(sk, retAddr) {
  /* Where retAddr is the addr returned from malloc */
  return new Promise(resolve => {
    sk.emit("read_from_address", { size: ptrSize, address: retAddr }, data => {
      /* Callback for addr read  */
      var size_state = parseInt(changeEndianness(data.result), 16);
      size_state = ((size_state >> 1) << 1);
      resolve(size_state);
    });
  });
}

function getContentsAt(sk, addr, size) {
  console.log("getting read_from_address with addr ", addr, " size ", size);
  return new Promise(resolve => {
    sk.emit("read_from_address", { size: size, address: addr }, data => {
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
      var newChunk = condense(retAddr, contents, 'inuse_malloc_chunk', allocSize);
      inUseGroup.chunks.push({ id: newChunk.addr, group: 'inUse', label: JSON.stringify(newChunk, null, 2) });
      console.log(inUseGroup.chunks[inUseGroup.chunks.length - 1].data);
      redraw();
      sk.emit('continue_execution');
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
  console.log('freed ', freedAddr);
  getAllocSize(sk, freedAddr - ptrSize).then((allocSize) => {
    getContentsAt(sk, freedAddr - (2 * ptrSize), allocSize).then((contents) => {
      var inUseGroup = state.groups.find(g => g.name == 'inUse')
      if (inUseGroup.chunks.find(c => c.id == freedAddr)) {
        /* remove from inUse */
        var freedChunkIdx = inUseGroup.chunks.findIndex(c => c.id == freedAddr);
        console.log('freed chunk index ', freedChunkIdx);
        inUseGroup.chunks.splice(freedChunkIdx, 1);
      } else {
        /* Whoof, exploit! add to freelist */
      }
      /* which freelist? tcache, largebin, smallbin? */
      getMainArenaAddr(sk).then((main_arena) => {
        getMainArenaSize(sk, main_arena).then((main_arena_size) => {
          getMainArenaContents(sk, main_arena, main_arena_size).then((main_arena_contents) => {
            gMainArena = condense(main_arena, main_arena_contents.slice(8), 'malloc_state');
            console.log(gMainArena);
            getHeapBase(sk).then((heap_base_addr) => {
              derefAddr(sk, heap_base_addr).then((heap_base)  => {
                getTcacheBins(sk, heap_base).then((tcache_bins) => {
                  gTcache = condense(heap_base, tcache_bins, 'tcache_bins');
                  console.log('got tcache bins: ', gTcache);
                  if (gTcache.data.bins.includes(freedAddr)) {
                    /* freed bin is in tcache */
                    var tCacheGroup = state.groups.find(g => g.name === 'tcache');
                    var newChunk = condense(freedAddr, contents, 'malloc_chunk');
                    tCacheGroup.chunks.push({ id: newChunk.addr, group: 'tcache', label: JSON.stringify(newChunk, null, 2) });

                  } else if (gMainArena.fastbinsY.includes(freedAddr)) {
                    /* freed bin is in fastbin */
                  } else {
                    /* freed bin is in regular bins */
                  }
                  redraw();
                  sk.emit('continue_execution');
                });
              });
            });
          });
        });
      });
    });
  });
}

/* gef-side events */
