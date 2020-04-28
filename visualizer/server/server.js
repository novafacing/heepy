var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var fs = require('fs');
var path = require('path');
const web = io.of("/web");
const gef = io.of("/gef");
var state = {};

server.listen(3000);

var initialized = false;

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

gef.on("connect", function(socket) {
  console.log('Got connection from gef');
  gef.emit("continue_execution");
  state = {};
});

var onevent = gef.onevent;
gef.onevent = function (packet) {
    var args = packet.data || [];
    onevent.call (this, packet);    // original call
    packet.data = ["*"].concat(args);
    onevent.call(this, packet);      // additional call to catch-all
};
gef.on("*",function(event,data) {
    console.log(event);
    console.log(data);
});


function getVersionNumber () {
  /* call the version number emit */
  return new Promise(resolve => {
    gef.emit('libc_version', '', (data) => {
      resolve(data.result);
    });
  });
}

function getAllocSize (retAddr) {
  /* Where retAddr is the addr returned from malloc */
  var ptrSize = 8;
  return new Promise(resolve => {
    gef.emit('read_from_address', { size: ptrSize, addr: retAddr - ptrSize }, (data) => {
    /* Callback for addr read  */
      resolve(data);
    });
  });
}

function getContentsAt (addr, size) {
  return new Promise(resolve => {
    gef.emit('read_from_address', { size: size, addr: addr }, (data) => {
      resolve(data.result);
    });
  });
}

function malloc (st, data) {
  console.log('Got malloc');
  var ptrSize = 8;
  var retAddr = data['rax-after-call'];
  getAllocSize.then(allocSize => {
    console.log(getContentsAt(retAddr - (2 * ptrSize), allocSize));
  });
}

function calloc (st, data) {
}
function realloc (st, data) {
}
function free (st, data) {
}

gef.on("heap_changed", (data) => {
  switch(data['called-function']) {
    case 'malloc':
      malloc(state, data);
      break;
    case 'calloc':
      calloc(state, data);
      break;
    case 'realloc':
      realloc(state, data);
      break;
    case 'free':
      free(state, data);
      break;
  };

   
});

/* gef-side events */


