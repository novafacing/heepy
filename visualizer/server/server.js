var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
const path = require("path");
const web = io.of("/web");
const gef = io.of("/gef");

server.listen(3000);

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "/index.html"));
});
app.get("/index.js", function(req, res) {
  res.sendFile(path.join(__dirname, "/index.js"));
});

/* web-side events */
web.on("connection", function(socket) {
  web.emit("client-hello", {
    connection: "success"
  });

  web.emit("add-node", {
    id: "dummy1",
    group: "dummy1",
    label: "dummy1"
  });

  /*web.emit("update-node", {
    id: "dummy",
    group: "dummy1",
    label: "updated_value\nwoo!"
  });
  */

  web.emit("add-node", {
    id: "dummy2",
    group: "dummy2",
    label: "dummy2"
  });

  web.emit("add-node", {
    id: "dummy3",
    group: "dummy3",
    label: "dummy3"
  });

  web.emit("add-node", {
    id: "dummy4",
    group: "dummy4",
    label: "dummy4"
  });

  web.emit("connect-nodes", {
    from: "dummy1",
    to: "dummy2",
  });
  web.emit("connect-nodes", {
    from: "dummy2",
    to: "dummy3",
  });
  web.emit("connect-nodes", {
    from: "dummy3",
    to: "dummy4",
  });

  web.emit("remove-node", {
    id: "dummy2",
  });

  /*web.emit("disconnect-nodes", {
    from: "dummy",
    to: "dummy2",
  });
  */

});


/* gef-side events */
gef.on("connection", function(socket) {
  gef.emit("client-hello", {
    connection: "success"
  });
});
