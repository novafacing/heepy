var io = require('socket.io-client')
var vis = require('visjs-network')
var socket = io.connect('http://localhost:3000/web')

var network
var nodes
var edges

function initNetwork () {
  var container = document.getElementById('app')
  var options = {
    manipulation: false,
    height: '100%',
    layout: {
      hierarchical: {
        enabled: true,
        levelSeparation: 300,
        direction: 'LR'
      }
    }
  }
  nodes = new vis.DataSet()
  edges = new vis.DataSet()
  var data = {
    nodes: nodes,
    edges: edges
  }
  network = new vis.Network(container, data, options)
}

function addNode (newId, newGroup, newLabel) {
  nodes.add({
    id: newId,
    group: newGroup,
    label: newLabel
  })
}

function updateNetwork () {
  network.setData({
    nodes: nodes,
    edges: edges
  })
  network.stabilize()
}

socket.on('client-hello', function (data) {
  console.log('Connection successful.', data)
  initNetwork()
})
socket.on('add-node', function (data) {
  addNode(data.id, data.group, data.label)
  updateNetwork()
})