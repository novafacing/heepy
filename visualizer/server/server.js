var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var middleware = require("socketio-wildcard")();
var fs = require("fs");
var path = require("path");
io.use(middleware);
const web = io.of("/web");
const gef = io.of("/gef");
var structsPath = path.join("./", "alloxtract", "structs");
if (!fs.existsSync(structsPath)) {
  throw "You need to run alloxtract!";
}

var nextChunkIdValue = 0;
function nextChunkId() {
  return nextChunkIdValue++;
}

/* Redraws the window by clearning and then re-adding the nodes we want to appear.
 * Callbacks manage the state by adding or removing nodes from the state object
 */
function redraw() {
  web.emit("clear");
  //console.dir(state, { depth: 7 });
  for (var group in state.groups) {
    group = state.groups[group];
    /* Currently only draws inuse and tcache */
    if (group.name === "inUse") {
      for (var chunk in group.chunks) {
        addNodeToClient(group.chunks[chunk]);
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
    if (
      group.name === "small" ||
      group.name === "large" ||
      group.name === "unsorted"
    ) {
      for (var bin in group.bins) {
        for (var chunk in group.bins[bin].chunks) {
          addNodeToClient(group.bins[bin].chunks[chunk]);
        }
      }
    }
  }
  console.dir(state, { depth: 7 });
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
      bins: []
    },
    {
      name: "small",
      bins: []
    },
    {
      name: "large",
      bins: []
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
var structures = {};

server.listen(3000);

function addNodeToClient(node) {
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

  // Debugging
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

  // Add to client
  // 3 cases
  // 1: no neighbors, can just add and be done
  // 2: 1 neighbor, add node and connect the two
  // 3: 2 neighbors, disconnect neighbors, add new node, connect left to new node, connect right to new node

  // Find correct group and set it to group
  let group;
  for (let groupIndex = 0; groupIndex < state.groups.length; groupIndex++) {
    if (state.groups[groupIndex].name === node.group) {
      group = state.groups[groupIndex];
      break;
    }
  }

  // Check if group has bins or chunks
  if (group.chunks == undefined) {
    addBinNodeToClient(node, group);
  } else {
    addChunkNodeToClient(node, group);
  }
}

function addBinNodeToClient(node, group) {
  // Find chunk in bin, then call addChunkNodeToClient(node, group);
  // Find which chunks list node is in
  // Loop through bin
  for (let i = 0; i < group.bins.length; i++) {
    // Loop through chunks in bin
    for (let j = 0; j < group.bins[i].chunks.length; j++) {
      // If id matches, call addChunkNodeToClient
      if (group.bins[i].chunks[j].id === node.id)
        addChunkNodeToClient(node, group.bins[i]);
    }
  }
}

function addChunkNodeToClient(node, group) {
  // 1 chunk case
  if (group.chunks.length === 1) {
    // Add node to client
    web.emit("add-node", node);
    return;
  }

  // Non empty group
  // Loop through group and check ids
  // nodeIndex is the index that the node is being inserted to
  let nodeIndex = 0;
  for (; nodeIndex < group.chunks.length; nodeIndex++) {
    // Break if current id is larger than id to be inserted
    //if (parseInt(group.chunks[nodeIndex], 16) > parseInt(node.address, 16))
    if (group.chunks[nodeIndex].id > node.id) break;
  }

  // Check case 2 if nodeIndex is first or last of list
  console.log(
    "Final nodeIndex: ",
    nodeIndex,
    "Chunk length: ",
    group.chunks.length
  );
  if (nodeIndex === 0) {
    web.emit("add-node", node);
    console.log(
      "calling connect-nodes for case2, head",
      node.id,
      group.chunks[1].id
    );
    web.emit("connect-nodes", {
      from: node.id,
      to: group.chunks[1].id
    });
    return;
  } else if (nodeIndex === group.chunks.length) {
    // Insert at tail and add connection from old tail to node
    web.emit("add-node", node);
    console.log(
      "calling connect-nodes for case2, tail",
      group.chunks[group.chunks.length - 1].id,
      node.id
    );
    if (group.chunks[group.chunks.length - 1].id !== node.id) {
      web.emit("connect-nodes", {
        from: group.chunks[group.chunks.length - 1].id,
        to: node.id
      });
    }
    return;
  }

  // Case 3 2 neighbors
  // Disconnect prev next
  // Save ids for later
  let prev = group.chunks[nodeIndex - 1];
  let next = group.chunks[nodeIndex];
  console.log("calling disconnect-nodes for case3");
  web.emit("disconnect-nodes", { from: prev.id, to: next.id });

  web.emit("add-node", node);
  console.log("calling connect-nodes for case3", prev.id, node.id, next.id);
  // Prevent self loops, should still work to show double free since the id is iterative
  if (prev.id !== node.id)
    web.emit("connect-nodes", { from: prev.id, to: node.id });
  if (node.id !== next.id)
    web.emit("connect-nodes", { from: node.id, to: next.id });
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
  var defines = structures["defines"];
  constants.tcache_max_bins =
    "TCACHE_MAX_BINS" in defines ? Number(defines["TCACHE_MAX_BINS"]) : 64;
  constants.smallbin_correction = Number(
    constants.malloc_alignment > 2 * constants.size_sz
  );
  constants.smallbin_width = constants.malloc_alignment;
  constants.min_large_size =
    (defines["NSMALLBINS"] - constants.smallbin_correction) *
    constants.smallbin_width;
  return constants;
}

function getStaticConstants() {
  let ver = glibcVersion;
  if (!("defines" in structures)) {
    structures["defines"] = JSON.parse(
      fs.readFileSync(path.join(structsPath, ver, "defines.json"), {
        encoding: "utf8"
      })
    );
  }
  var defines = structures["defines"];
  var size_sz = ptrSize;
  var max_fast_size = (80 * size_sz) / 4;
  var malloc_alignment = 2 * size_sz;
  var malloc_align_mask = malloc_alignment - 1;
  var nbins = "NBINS" in defines ? Number(defines["NBINS"]) : 128;
  var binmapshift =
    "BINMAPSHIFT" in defines ? Number(defines["BINMAPSHIFT"]) : 5;
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

function tcacheBins() {
  return {
    bins: {
      size: ptrSize,
      count: getConstants().tcache_max_bins
    }
  };
}

function getStructSize(structure) {
  let size = 0;
  for (prop in structure) {
    size += structure[prop].size * structure[prop].count;
  }
  return size;
}

function mallocChunk() {
  let ver = glibcVersion;
  if (!("malloc_chunk" in structures)) {
    structures["malloc_chunk"] = JSON.parse(
      fs.readFileSync(path.join(structsPath, ver, "malloc_chunk.json"), {
        encoding: "utf8"
      })
    );
  }
  return structures["malloc_chunk"];
}

function inUseMallocChunk(totalSize) {
  let ver = glibcVersion;
  if (!("malloc_chunk_inuse" in structures)) {
    structures["malloc_chunk_inuse"] = JSON.parse(
      fs.readFileSync(path.join(structsPath, ver, "malloc_chunk_inuse.json"), {
        encoding: "utf8"
      })
    );
  }
  return structures["malloc_chunk_inuse"];
}

function mallocPar() {
  let ver = glibcVersion;
  if (!("malloc_par" in structures)) {
    structures["malloc_par"] = JSON.parse(
      fs.readFileSync(path.join(structsPath, ver, "malloc_par.json"), {
        encoding: "utf8"
      })
    );
  }
  return structures["malloc_par"];
}

function mallocState() {
  let ver = glibcVersion;
  if (!("malloc_state" in structures)) {
    structures["malloc_state"] = JSON.parse(
      fs.readFileSync(path.join(structsPath, ver, "malloc_state.json"), {
        encoding: "utf8"
      })
    );
  }
  return structures["malloc_state"];
}

/* Takes raw data and a JSON prototype (defined above)
 * and puts the data into the prototype.
 */
function condense(addr, raw, prototype, ...kwargs) {
  /* kwargs can be used for any condense operation that requires additional arguments */
  //console.log("condense kw ", kwargs);
  let condensed = {};
  let loc = 0;
  switch (prototype) {
    case "malloc_chunk":
      //console.log("condensing into ", mallocChunk());
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
      //console.log("condensing into ", inUseMallocChunk(kwargs[0]));
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
      //console.log("condensing into ", mallocState());
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
      //console.log("condensing into ", tcacheBins());
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
      getVersionNumber(socket).then(vnum => {
        /* Try initializing */
        glibcVersion = vnum;
        mallocChunk();
        inUseMallocChunk();
        mallocState();
        mallocPar();
        getPtrSize(socket).then(ptsize => {
          getMainArenaAddr(socket).then(main_arena => {
            getMainArenaSize(socket, main_arena).then(main_arena_size => {
              getMainArenaContents(socket, main_arena, main_arena_size).then(
                main_arena_contents => {
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

  socket.on("disconnect", function(socket) {
    console.log("Got disconnect from client");
    process.exit();
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
    resolve(getStructSize(mallocState()));
  });
}

function getHeapBase(socket) {
  /* Finds the base address of the heap from the malloc_par struct. */
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject("No connection.");
    } else {
      let expr =
        "(unsigned long)((void*)&mp_+" + mallocPar().sbrk_base.offset + ")";
      socket.emit("evaluate_expression", { expression: expr }, data => {
        console.log(
          "addr of heap base ",
          parseInt(data.result, 10).toString(16)
        );
        resolve(parseInt(data.result, 10));
      });
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
    sk.emit(
      "read_from_address",
      { size: ptrSize, address: Number(retAddr) },
      data => {
        /* Callback for addr read  */
        var size_state = parseInt(changeEndianness(data.result), 16);
        size_state = (size_state >> 1) << 1;

        resolve(size_state);
      }
    );
  });
}

function getContentsAt(sk, addr, size) {
  /* Safety check, can probably be eliminated */
  if (size < 16) {
    size = 16;
  }
  return new Promise(resolve => {
    sk.emit(
      "read_from_address",
      { size: size, address: Number(addr) },
      data => {
        resolve(data.result);
      }
    );
  });
}

function malloc(sk, st, data) {
  /* handle malloc event on socket sk with state st and received data data */
  console.log("Got malloc");
  var retAddr = data["rax-after-call"];
  getAllocSize(sk, retAddr - ptrSize).then(allocSize => {
    getContentsAt(sk, retAddr - 2 * ptrSize, allocSize).then(contents => {
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
      getContentsAt(
        sk,
        chunk_addr - 2 * ptrSize,
        tcNodeSize + 2 * ptrSize
      ).then(contents => {
        console.log("got tcache chunk at ", chunk_addr);
        var tc_entry = condense(chunk_addr, contents, "malloc_chunk");
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
          resolve();
        });
      });
    });
  });
}

function getFastbinChunks(sk, chunk_addr, current_chunk_list) {
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

function getDataFieldOffset(mallocChunk) {
  for (prop in mallocChunk) {
    if ("data" in mallocChunk[prop]) {
      return mallocChunk[prop].offset;
    }
  }
  return null;
}

function mChunkSizeToSize(sz) {
  return (sz >> 1) << 1;
}

function getBinType(binID, chunk) {
  if (binID == 1) {
    return "unsorted";
  }
  if (
    mChunkSizeToSize(chunk.data.mchunk_size) >= getConstants().min_large_size
  ) {
    return "large";
  }
  return "small";
}

function getNormalBinChunks(sk, idx, fdPtr, bkPtr, stPtr, current_chunk_list) {
  var binID = idx + 1;
  /* sanity check */
  if (fdPtr == bkPtr || fdPtr == 0) {
    return new Promise(resolve => {
      resolve();
    });
  }
  return new Promise((resolve, reject) => {
    getAllocSize(sk, fdPtr + mallocChunk().mchunk_size.offset).then(
      currChunkSize => {
        getContentsAt(sk, fdPtr, currChunkSize).then(contents => {
          //console.log('got normal bin chunk at ', fdPtr);
          var nb_entry = condense(fdPtr, contents, "malloc_chunk");
          var group = getBinType(binID, nb_entry);
          current_chunk_list.push({
            addr: nb_entry.addr + getDataFieldOffset(mallocChunk()),
            id: nextChunkId(),
            group: getBinType(binID, nb_entry),
            label: JSON.stringify(nb_entry, null, 2)
          });
          fdPtr = nb_entry.data.fd;
          bkPtr = nb_entry.data.bk;
          //console.log('fd/bk ptr for normal bin ', fdPtr, bkPtr);
          if (fdPtr == stPtr) {
            resolve();
          }
          getFastbinChunks(
            sk,
            idx,
            fdPtr,
            bkPtr,
            stPtr,
            current_chunk_list
          ).then(() => {
            //console.log('finished finding normal bin chunks for idx ', idx);
            resolve();
          });
        });
      }
    );
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
                  /* FIXME: This is a real weird thing where a bit gets written when
                   * a chunk over 1k size is freed.... */
                  if (exAddr[addr] > 0 && exAddr[addr] != 281474976710656) {
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
                    await getFastbinChunks(
                      sk,
                      Number(addrs[addr]),
                      next_bin.chunks
                    );
                  }
                }

                console.log("Now updating normal bins");
                var unsortedbins = state.groups.find(g => g.name === "unsorted")
                  .bins;
                var largebins = state.groups.find(g => g.name === "large").bins;
                var smallbins = state.groups.find(g => g.name === "small").bins;
                var bins = gMainArena.data.bins;
                unsortedbins.splice(0, unsortedbins.length);
                largebins.splice(0, largebins.length);
                smallbins.splice(0, smallbins.length);
                for (var idx = 0; idx < bins.length; idx += 2) {
                  /* idx is idx of fd ptr */
                  next_bin = {
                    chunks: []
                  };
                  await getNormalBinChunks(
                    sk,
                    idx,
                    Number(bins[idx]),
                    Number(bins[idx + 1]),
                    Number(bins[idx]),
                    next_bin.chunks
                  );
                  console.log("NORMAL BIN CHUNKS GOT ", next_bin.chunks);
                  if (next_bin.chunks.length > 0) {
                    var ccl_new_size = new Set(
                      next_bin.chunks.map(c => c.group)
                    ).size;
                    if (ccl_new_size > 1) {
                      console.log(next_bin.chunks.map(c => c.group));
                      console.log(ccl_new_size);

                      throw "Not all chunks in bin were the same group!";
                    }
                    var ccl_group = next_bin.chunks[0].group;
                    console.log(
                      "**********************************************ccl group is ",
                      ccl_group,
                      " with chunks ",
                      next_bin.chunks
                    );
                    if (ccl_group === "small") {
                      console.log("adding chunk to small ");
                      state.groups
                        .find(g => g.name === "small")
                        .bins.push(next_bin);
                    } else if (ccl_group === "large") {
                      console.log("adding chunk to large ");
                      state.groups
                        .find(g => g.name === "large")
                        .bins.push(next_bin);
                    } else if (ccl_group === "unsorted") {
                      console.log("adding chunk to unsorted");
                      state.groups
                        .find(g => g.name === "unsorted")
                        .bins.push(next_bin);
                    }
                  } else {
                    console.log("No chunks in normal bin ", idx);
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
