import socketio
import eventlet

# create a Socket.IO server
sio = socketio.Server()
app = socketio.WSGIApp(sio)

def read_from_address_callback(data):
    print("Read from address {}:{}".format(data["address"], data["result"]))

def symbol_addr_callback(data):
    print("Got symbol address {}".format(data))
    sio.emit("read_from_address", {"address": data["result"], "size": 8}, callback=read_from_address_callback)

@sio.event
def connect(sid, environ):
    print("Connected: {}".format(sid))
    sio.emit("address_of_symbol", {"symbol_name": "main_arena"}, callback=symbol_addr_callback)

@sio.event
def heap_changed(sid, data):
    print("Heap changed!")
    sio.emit("address_of_symbol", {"symbol_name": "main_arena"}, callback=symbol_addr_callback)
    #sio.emit("continue_execution")

eventlet.wsgi.server(eventlet.listen(('127.0.0.1', 5000)), app)
