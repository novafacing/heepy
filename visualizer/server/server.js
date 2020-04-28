var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var middleware = require('socketio-wildcard')();
var fs = require('fs');
var path = require('path');
io.use(middleware);
const web = io.of("/web");
const gef = io.of("/gef");
var state = {};
var glibcVersion = -1;

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
  socket.on('*', function (data) {
    console.log('Got unknown callback with data ', data);
  });
  socket.on("heap_changed", (data) => {
    console.log('Got heap change event with data ', data);
    switch(data['called-function']) {
      case 'malloc':
        malloc(socket, state, data);
        break;
      case 'calloc':
        calloc(socket, state, data);
        break;
      case 'realloc':
        realloc(socket, state, data);
        break;
      case 'free':
        free(socket, state, data);
        break;
    };
  });
  console.log('Got connection from gef');
  glibcVersion = getVersionNumber(socket).then((data) => {
    socket.emit("continue_execution");
    return data;
  });
  state = {};
});

function getVersionNumber (socket) {
  /* call the version number emit */
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject('No connection.');
    } else {
      socket.emit('libc_version', (data) => {
        resolve(data);
      });
    }
  });
}

const changeEndianness = (string) => {
        console.log('reverse-ending ', string);
        const result = [];
        let len = string.length - 2;
        while (len >= 0) {
          result.push(string.substr(len, 2));
          len -= 2;
        }
        console.log('end changed ', result.join(''));
        return result.join('');
}

const roundAlloc = (req) => {
}

function getAllocSize (sk, retAddr) {
  /* Where retAddr is the addr returned from malloc */
  var ptrSize = 8;
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
  var ptrSize = 8;
  var retAddr = data['rax-after-call'];
  console.log('got addr ', retAddr);
  getAllocSize(sk, retAddr - ptrSize).then((allocSize) => {
    getContentsAt(sk, retAddr - (2 * ptrSize), allocSize);
  });
}

function calloc (sk, st, data) {
}
function realloc (sk, st, data) {
}
function free (sk, st, data) {
}


/* gef-side events */


