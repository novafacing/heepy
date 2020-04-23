var io = require("socket.io-client");
var vis = require("visjs-network");
var socket = io.connect("http://localhost:3000/web");

var network;
var nodes;
var edges;

var nodeIds = [];
var edgeIds = [];

const options = {
  manipulation: false,
  height: "100%",
  layout: {
    hierarchical: {
      enabled: true,
      levelSeparation: 100,
      direction: "UD"
    }
  },
  nodes: {
    shape: "box",
    font: {
      face: "monospace",
      align: "left"
    },
    physics: false
  },
  edges: {
    physics: false
  },
  groups: {
    free: {
      color: "#109618" // green
    },
    inUse: {
      color: "#C5000B" // red
    },
    largeBins: {
      color: "#FFFF00" // yellow
    },
    tcache: {
      color: "#2B7CE9" // blue
    },
    fastBins: {
      color: "#FF9900" // orange
    }
  }
};

var legend = [
  {
    id: "legend0",
    label: "Free",
    group: "free",
    fixed: true,
  },
  {
    id: "legend1",
    label: "In Use",
    group: "inUse",
    fixed: true,
  },
  {
    id: "legend2",
    label: "Large Bins",
    group: "largeBins",
    fixed: true,
  },
  {
    id: "legend3",
    label: "TCache",
    group: "tcache",
    fixed: true,
  },
  {
    id: "legend4",
    label: "Fast Bins",
    group: "fastBins",
    fixed: true,
  }
];

function addLegend() {
  var lastId;

  for (let i = 0; i < legend.length; i++) {
    nodes.add(legend[i]);
    if (i !== 0) connectNodes(lastId, legend[i].id, true);
    lastId = legend[i].id;
  }
}

function initNetwork() {
  // Init network to net_container_0
  var container = document.getElementById("networkContainer");

  // Create new nodes and edges
  nodes = new vis.DataSet();
  edges = new vis.DataSet();
  // Store into data
  var data = {
    nodes: nodes,
    edges: edges
  };

  // Create new network with container, data, and options
  network = new vis.Network(container, data, options);

  addLegend();
}

function addNode(newId, newGroup, newLabel) {
  nodes.add({
    id: newId,
    group: newGroup,
    label: newLabel
    /*color: "#FFCFCF"*/
  });
  nodeIds.push(newId);
}

function updateNode(id, newGroup, newLabel) {
  nodes.update({
    id: id,
    group: newGroup,
    label: newLabel
  });
}

function removeNode(id) {
  nodes.remove({ id: id });

  // Find and remove id from nodeIds
  for (let i = 0; i < nodeIds.length; i++) {
    if (nodeIds[i] === id) {
      nodeIds.splice(i, 1);
      break;
    }
  }

  // Remove all edges to and from node
  for (let i = 0; i < edgeIds.length; i++) {
    let edge = edges.get(edgeIds[i]);
    if (edge.to === id || edge.from === id) {
      // Remove from edgeIds
      edgeIds.splice(i, 1);
      // Remove from edges
      edges.remove({ id: edge.from + edge.to });
    }
  }
}

function updateNetwork() {
  network.setData({
    nodes: nodes,
    edges: edges
  });
  network.stabilize();
}

function connectNodes(from, to, legend) {
  if (legend === true) {
    console.log("legend", from, to);
    edges.add({
      id: from + to,
      from: from,
      to: to,
      color: { inherit: false, color: "#FFFFFF" }
    });
  } else {
    edges.add({ id: from + to, from: from, to: to });
  }
}

function disconnectNodes(from, to) {
  edges.remove({ id: from + to });
}

socket.on("client-hello", function(data) {
  console.log("Connection successful.", data);
  initNetwork();
});

socket.on("add-node", function(data) {
  addNode(data.id, data.group, data.label);
  updateNetwork();
});

socket.on("update-node", function(data) {
  updateNode(data.id, data.group, data.label);
  updateNetwork();
});

socket.on("remove-node", function(data) {
  removeNode(data.id);
  updateNetwork();
});

socket.on("connect-nodes", function(data) {
  connectNodes(data.from, data.to, false);
  updateNetwork();
});

socket.on("disconnect-nodes", function(data) {
  disconnectNodes(data.from, data.to);
  updateNetwork();
});
