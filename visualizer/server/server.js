var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var middleware = require("socketio-wildcard")();
var fs = require("fs");
var path = require("path");
io.use(middleware);
const web = io.of("/web");
const gef = io.of("/gef");

var nextChunkIdValue = 0;
function nextChunkId() {
  return nextChunkIdValue++;
}

/* Redraws the window by clearning and then re-adding the nodes we want to appear.
 * Callbacks manage the state by adding or removing nodes from the state object
 */
function redraw() {
  web.emit("clear");
  console.log("redrawing");
  console.dir(state, { depth: 6 });
  for (var group in state.groups) {
    group = state.groups[group];
    /* Currently only draws inuse and tcache */
    if (group.name === "inUse") {
      for (var chunk in group.chunks) {
        addNodeToClient(group.chunks[chunk], true);
      }
    }
    if (group.name === "tcache") {
      for (var bin in group.bins) {
        for (var chunk in group.bins[bin].chunks) {
          addNodeToClient(group.bins[bin].chunks[chunk]);
        }
      }
    }
    if (group.name === "fastbins") {
      for (var bin in group.bins) {
        for (var chunk in group.bins[bin].chunks) {
          addNodeToClient(group.bins[bin].chunks[chunk]);
        }
      }
    }
  }
  console.dir(state, { depth: 5 });
}

const inUseGroupIndex = 6;
var state = {
  groups: [
    {
      name: "tcache",
      bins: []
    },
    {
      name: "fastbins",
      bins: []
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

function addNodeToClient(node, redraw) {
  if (typeof redraw == undefined) {
    redraw = false;
  }

  // Adds node to client and stores in order state on server.
  // node is an object in the form:
  // {
  //  id: "0x00",
  //  group: "inUse",
  //  label: "prev: 100\n..."
  // }
  // Check argument same as an assert
  if (
    !node.hasOwnProperty("id") ||
    !node.hasOwnProperty("group") ||
    !node.hasOwnProperty("label")
  ) {
    console.log("Invalid call to addNodeToClient, missing id, group, or label");
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

  // Add to state
  // 3 cases
  // 1: no neighbors, can just add and be done
  // 2: 1 neighbor, add node and connect the two
  // 3: 2 neighbors, disconnect neighbors, add new node, connect left to new node, connect right to new node

  // Find correct group
  let groupIndex = 0;
  for (; groupIndex < state.groups.length; groupIndex++) {
    if (state.groups[groupIndex].name === node.group) break;
  }

  if (state.groups[groupIndex].name == "tcache") {
    web.emit("add-node", node);
    return;
  }

  if (state.groups[groupIndex].name == "fastbins") {
    web.emit("add-node", node);
    return;
  }

  // Empty group case
  if (state.groups[groupIndex].chunks.length === 0) {
    // Add node to client state
    // FIXME: WHY IS THIS CODE NEEDED
    // ITS ALREADY IN TEH STATEATE IF REDRAW IS CALLED
    //           state.groups[groupIndex].chunks.push(node);
    // Add node to client
    //
    console.log("NOOOOOO :(");
    web.emit("add-node", node);
    return;
  }

  // Non empty group
  // Loop through group and check addresses
  // nodeIndex is the index that the node is being inserted to
  let nodeIndex = 0;
  for (; nodeIndex < state.groups[groupIndex].chunks.length; nodeIndex++) {
    // Break if current address is larger than address to be inserted
    if (
      parseInt(state.groups[groupIndex].chunks[nodeIndex], 16) >
      parseInt(node.address, 16)
    )
      break;
  }

  // Check case 2 if nodeIndex is first or last of list
  console.log("Final nodeIndex: ", nodeIndex);
  if (nodeIndex === 0) {
    if (!redraw) {
      // Insert at head and add connection from node to old head
      state.groups[groupIndex].chunks.splice(0, 0, node);
    }
    web.emit("add-node", node);
    console.log("calling connect-nodes");
    web.emit("connect-nodes", {
      from: node.id,
      to: state.groups[groupIndex].chunks[1].id
    });
    return;
  } else if (nodeIndex === state.groups[groupIndex].chunks.length) {
    // TODO: check if this is length or length - 1
    // Insert at tail and add connection from old tail to node
    web.emit("add-node", node);
    web.emit("connect-nodes", {
      from:
        state.groups[groupIndex].chunks[
          state.groups[groupIndex].chunks.length - 1].id,
      to: node.id
    });
    return;
  }

  // Case 3 2 neighbors
  // Disconnect groups[nodeIndex-1] groups[nodeIndex]
  // Save ids for later
  let prev = state.groups[groupIndex].chunks[nodeIndex - 1];
  let next = state.groups[groupIndex].chunks[nodeIndex];
  web.emit("disconnect-nodes", { from: prev.id, to: next.id });

  if (!redraw) {
    // Add new node
    state.groups[groupIndex].chunks.splice(nodeIndex, 0, node);
  }
  web.emit("add-node", node);
  web.emit("connect-nodes", { from: prev.id, to: node.id });
  web.emit("connect-nodes", { from: node.id, to: next.id });

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
        addr: jsonObject.groups[i].chunks[j].addr,
        id: jsonObject.groups[i].chunks[j].id,
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

// TODO: Needs to come from C
function minChunkSize() {
  return offsetOf(mallocChunk(), "fd_nextsize");
}

// TODO: Needs to come from C
function minSize() {
  var constants = getStaticConstants();
  return (
    (minChunkSize() + constants.malloc_align_mask) &
    ~constants.malloc_align_mask
  );
}

// TODO: Needs to come from C
function request2size(req) {
  var constants = getStaticConstants();
  return req + constants.size_sz + constants.malloc_align_mask < minSize()
    ? minSize()
    : (req + constants.size_sz + constants.malloc_align_mask) &
        ~malloc_align_mask;
}

// TODO: Needs to come from C
function fastbin_index(sz) {
  var constants = getStaticConstants();
  return (sz >> (constants.size_sz == 8 ? 4 : 3)) - 2;
}

// TODO: Needs to come from C
function getConstants() {
  var constants = getStaticConstants();
  // TODO: Make this the actual calculation
  // constants.nfastbins = fastbin_index(constants.max_fast_size);
  constants.nfastbins = 10;
  constants.tcache_max_bins = 64;
  return constants;
}

// TODO: Needs to come from C
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

// TODO: Needs to come from C
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

// TODO: Needs to come from C
function tcacheBins() {
  return {
    bins: {
      size: ptrSize,
      count: getConstants().tcache_max_bins
    }
  };
}

/* TODO: This will be replaced with a version that takes the glibc version
 * and returns the correct chunk layout (in this format)
 */

function mallocChunk() {
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

/* TODO: This will be replaced with a version that takes the glibc version
 * and returns the correct chunk layout (in this format)
 */

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

/* TODO: This will be replaced with a version that takes the glibc version
 * and returns the correct chunk layout (in this format)
 */

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

/* Takes raw data and a JSON prototype (defined above)
 * and puts the data into the prototype.
 */
function condense(addr, raw, prototype, ...kwargs) {
  /* kwargs can be used for any condense operation that requires additional arguments */
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
      /* kwargs[0] is expected to contain the REQUEST size of the inuse malloc chunk */
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
    case "tcache_bins":
      /* TODO: This might be broken */
      console.log("condensing ", raw, " into ", tcacheBins());
      let cacheBins = tcacheBins();
      for (let member in cacheBins) {
        if (cacheBins[member].count > 1) {
          condensed[member] = [];
          for (var i = 0; i < cacheBins[member].count; i++) {
            condensed[member].push(
              parseInt(
                changeEndianness(
                  raw.slice(loc, loc + cacheBins[member].size * 2)
                ),
                16
              )
            );
            loc += cacheBins[member].size * 2;
          }
        } else {
          condensed[member] = parseInt(
            changeEndianness(raw.slice(loc, loc + cacheBins[member].size * 2)),
            16
          );
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
  /* split a string into a list of num length strings */
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
  /* Calls the correct gef action (raised from backend.py, not actually gef) */
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
      /* Initialize the global data structures */
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
      /* otherwise just do the action */
      gefAction(socket, state, data);
    }
  });
  console.log("Got connection from gef");
  console.log("Continuing Execution ", new Error().lineNumber);
  socket.emit("continue_execution");
});

function getPtrSize(socket) {
  /* Finds the size of a pointer on the target system (expect 4 for 32 bit and 8 for 64 bit) */
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
    /* Gets the sizeof(main_arena) value */
    /* TODO: this should end up being calculated from C */
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
function getHeapBase(socket) {
  /* Finds the base address of the heap from the malloc_par struct. */
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject("No connection.");
    } else {
      // TODO: Make real
      //socket.emit('address_of_symbol', { symbol_name: 'mp_->sbrk_base' }, (data) => {
      /* TODO: Replace +72 with offsetOf(sbrk_whatever) */
      socket.emit(
        "evaluate_expression",
        { expression: "(unsigned long) (((void*)&mp_)+72)" },
        data => {
          console.log(
            "addr of heap base ",
            parseInt(data.result, 10).toString(16)
          );
          resolve(parseInt(data.result, 10));
        }
      );
    }
  });
}

function getTcacheBins(socket, addr) {
  /* Returns the raw contents of the tcache bins */
  var tcache_addr = addr + 2 * ptrSize + getConstants().tcache_max_bins;
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject("No connection.");
    } else {
      socket.emit(
        "read_from_address",
        {
          address: tcache_addr,
          size: ptrSize * getConstants().tcache_max_bins
        },
        data => {
          resolve(data.result);
        }
      );
    }
  });
}

function getMainArenaContents(socket, addr, size) {
  /* Gets the contents of the main arena */
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

function derefAddr(sk, addr) {
  return new Promise((resolve, reject) => {
    if (!sk) {
      reject("No connection.");
    } else {
      sk.emit("read_from_address", { address: addr, size: ptrSize }, data => {
        resolve(parseInt(changeEndianness(data.result), 16));
      });
    }
  });
}

function getVersionNumber(socket) {
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
  /* Flip a bytestring order. Needed because gdb returns reversed (0x1337 -> 0x3713) */
  const result = [];
  let len = string.length - 2;
  while (len >= 0) {
    result.push(string.substr(len, 2));
    len -= 2;
  }
  return result.join("");
};

function getAllocSize(sk, retAddr) {
  /* Where retAddr is the addr returned from malloc */
  return new Promise(resolve => {
    sk.emit("read_from_address", { size: ptrSize, address: Number(retAddr) }, data => {
      /* Callback for addr read  */
      var size_state = parseInt(changeEndianness(data.result), 16);
      size_state = (size_state >> 1) << 1;

      resolve(size_state);
    });
  });
}

function getContentsAt(sk, addr, size) {
  /* Safety check, can probably be eliminated */
  if (size < 16) {
    size = 16;
  }
  console.log("getting read_from_address with addr ", addr, " size ", size);
  return new Promise(resolve => {
    sk.emit("read_from_address", { size: size, address: Number(addr) }, data => {
      resolve(data.result);
    });
  });
}

function malloc(sk, st, data) {
  /* handle malloc event on socket sk with state st and received data data */
  console.log("Got malloc");
  var retAddr = data["rax-after-call"];
  console.log("got addr ", retAddr);
  getAllocSize(sk, retAddr - ptrSize).then(allocSize => {
    getContentsAt(sk, retAddr - 2 * ptrSize, allocSize).then(contents => {
      //for (var group in state.groups) {
      //  /* Remove node from a group if it's in one. TODO: this might be bugged */
      //  if (state.groups[group].chunks.find(c => c.addr == retAddr)) {
      //    var remidx = state.groups[group].chunks.findIndex(c => c.addr == retAddr);
      //    state.groups[group].chunks.splice(remidx, 1);
      //  }
      //}
      /* Add chunk to inuse */
      var inUseGroup = state.groups.find(g => g.name == "inUse");
      var newChunk = condense(
        retAddr,
        contents,
        "inuse_malloc_chunk",
        allocSize
      );
      inUseGroup.chunks.push({
        addr: newChunk.addr,
        id: nextChunkId(),
        group: "inUse",
        label: JSON.stringify(newChunk, null, 2)
      });
      console.log(inUseGroup.chunks[inUseGroup.chunks.length - 1].data);

      updateFreelists(sk, () => {
        redraw();
        console.log("Continuing Execution from malloc");
        sk.emit("continue_execution");
      });
    });
  });
}

function scanTcacheBins(sk, addrs) {}

function calloc(sk, st, data) {}
function realloc(sk, st, data) {}

function getTcacheChunks(sk, chunk_addr, current_chunk_list) {
  console.log("examining tcache chunk at ", chunk_addr);
  if (chunk_addr == 0) {
    return new Promise(resolve => {
      resolve();
    });
  }
  return new Promise((resolve, reject) => {
    getAllocSize(sk, chunk_addr - ptrSize).then(tcNodeSize => {
      getContentsAt(sk, chunk_addr - 2 * ptrSize, tcNodeSize + 2 * ptrSize).then(contents => {
        console.log("got tcache chunk at ", chunk_addr);
        var tc_entry = condense(chunk_addr, contents, "malloc_chunk");
        console.log("pushing ", tc_entry);
        current_chunk_list.push({
          addr: tc_entry.addr,
          id: nextChunkId(),
          group: "tcache",
          label: JSON.stringify(tc_entry, null, 2)
        });

        if (tc_entry.data.fd == 0) {
          resolve();
        }

        getTcacheChunks(sk, tc_entry.data.fd, current_chunk_list).then(() => {
          console.log("done finding tcache chunks, continuing");
          resolve();
        });
      });
    });
  });
}

function getFastbinChunks(sk, chunk_addr, current_chunk_list) {
  // TODO: Is the correct address displayed?
  //chunk_addr = chunk_addr + 2 * ptrSize

  console.log("examining fastbin chunk at ", chunk_addr);

  if (chunk_addr == 0) {
    return new Promise(resolve => {
      resolve();
    });
  }
  return new Promise((resolve, reject) => {
    getAllocSize(sk, Number(chunk_addr) + Number(ptrSize)).then(fbNodeSize => {
      getContentsAt(sk, chunk_addr, fbNodeSize).then(contents => {
        console.log("got fastbin chunk at ", chunk_addr);
        var fb_entry = condense(chunk_addr, contents, "malloc_chunk");
        console.log("pushing ", fb_entry);
        current_chunk_list.push({
          addr: fb_entry.addr + 2 * ptrSize,
          id: nextChunkId(),
          group: "fastbins",
          label: JSON.stringify(fb_entry, null, 2)
        });

        if (fb_entry.data.fd == 0) {
          resolve();
        }

        getFastbinChunks(sk, fb_entry.data.fd, current_chunk_list).then(() => {
          console.log("done finding fastbin chunks, continuing");
          resolve();
        });
      });
    });
  });
}

function updateFreelists(sk, cb) {
  getMainArenaAddr(sk).then(main_arena => {
    getMainArenaSize(sk, main_arena).then(main_arena_size => {
      getMainArenaContents(sk, main_arena, main_arena_size).then(
        main_arena_contents => {
          getHeapBase(sk).then(heap_base_addr => {
            /* We need to pull a bunch of info to do the calculation */
            derefAddr(sk, heap_base_addr).then(heap_base => {
              getTcacheBins(sk, heap_base).then(async function(tcache_bins) {
                /* clear */
                var tcache = state.groups.find(g => g.name === "tcache");
                gMainArena = condense(
                  main_arena,
                  main_arena_contents.slice(8),
                  "malloc_state"
                );
                var addrs = condense(heap_base, tcache_bins, "tcache_bins").data
                  .bins;
                console.log("tcache bins ", addrs);
                tcache.bins.splice(0, tcache.bins.length);
                var exAddr = {};
                for (var addr in addrs) {
                  exAddr[addr] = addrs[addr];
                  next_bin = {
                    chunks: []
                  };
                  tcache.bins.push(next_bin);
                  if (exAddr[addr] > 0) {
                    // There is a tcache list at this size
                    var add = exAddr[addr].valueOf();
                    await getTcacheChunks(sk, add, next_bin.chunks);
                  }
                }

                console.log("Now updating fastbins");
                var fastbins = state.groups.find(g => g.name === "fastbins");
                fastbins.bins.splice(0, fastbins.bins.length);
                addrs = gMainArena.data.fastbinsY;
                for (var addr in addrs) {
                  next_bin = {
                    chunks: []
                  };
                  fastbins.bins.push(next_bin);
                  if (addrs[addr] > 0) {
                    await getFastbinChunks(sk, Number(addrs[addr]), next_bin.chunks);
                  }
                }

                console.log("DONE UPDATING FREELISTS");
                cb();
              });
            });
          });
        }
      );
    });
  });
}

function free(sk, st, data) {
  /* Free is pretty wack */
  console.log("got free");
  var freedAddr = data["rdi-before-call"];
  console.log("freed ", freedAddr);
  if (freedAddr == 0) {
    console.log("skipping free - NULL freed");
    console.log("Continuing Execution from free");
    sk.emit("continue_execution");
    return;
  }
  getAllocSize(sk, freedAddr - ptrSize).then(allocSize => {
    getContentsAt(sk, freedAddr - 2 * ptrSize, allocSize).then(contents => {
      var inUseGroup = state.groups.find(g => g.name == "inUse");
      if (inUseGroup.chunks.find(c => c.addr == freedAddr)) {
        /* remove from inUse */
        var freedChunkIdx = inUseGroup.chunks.findIndex(
          c => c.addr == freedAddr
        );
        console.log("freed chunk index ", freedChunkIdx);
        inUseGroup.chunks.splice(freedChunkIdx, 1);
      } else {
        /* Whoof, exploit! add to freelist */
      }
      /* which freelist? tcache, largebin, smallbin? */
      updateFreelists(sk, () => {
        redraw();
        console.log("Continuing Execution from free");
        sk.emit("continue_execution");
      });
    });
  });
}

/* gef-side events */
