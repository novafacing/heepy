var app = require('express')()
var server = require('http').Server(app)
var io = require('socket.io')(server)
const path = require('path')
const web = io.of('/web')
const gef = io.of('/gef')

server.listen(3000)

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/index.html'))
})
app.get('/index.js', function (req, res) {
  res.sendFile(path.join(__dirname, '/index.js'))
})

/* web-side events */
web.on('connection', function (socket) {
  web.emit('client-hello', {
    connection: 'success'
  })
})

/* gef-side events */
gef.on('connection', function (socket) {
  gef.emit('client-hello', {
    connection: 'success'
  })
})