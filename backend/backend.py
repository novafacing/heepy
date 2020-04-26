#!/usr/bin/env python3
from pygdbmi.gdbcontroller import GdbController
import socketio
import time
import sys

sio = socketio.Client()

# recieves 'read-from-address' (addr, n_bytes)
# recieves 'address-of-symbol' (symbol_name)
# recieves 'continue-execution'
# emits 'heap-changed'
if len(sys.argv) < 2:
    print("Usage: {} ./binary\nAlso make sure the server is running.".format(sys.argv[0]))
    sys.exit()

gdbmi = GdbController()
response = gdbmi.write('-file-exec-and-symbols ' + sys.argv[1])
response = gdbmi.write('start')

# Break after each heap changing thing happens
response = gdbmi.write('-break-insert malloc')
bp_num = response[0]['payload']['bkpt']['number']
response = gdbmi.write('-break-commands {} "fin"'.format(bp_num))

response = gdbmi.write('-break-insert free')
bp_num = response[0]['payload']['bkpt']['number']
response = gdbmi.write('-break-commands {} "fin"'.format(bp_num))

response = gdbmi.write('-break-insert calloc')
bp_num = response[0]['payload']['bkpt']['number']
response = gdbmi.write('-break-commands {} "fin"'.format(bp_num))

response = gdbmi.write('-break-insert realloc')
bp_num = response[0]['payload']['bkpt']['number']
response = gdbmi.write('-break-commands {} "fin"'.format(bp_num))

# TODO: Handle heap writes

@sio.event
def read_from_address(data):
    print("ABOUT TO READ FROM {} BYTES FROM {}".format(data["size"], data["address"]))

    result = gdbmi.write("-data-read-memory-bytes " + str(data["address"]) + " " + str(data["size"]))
    value = result[0]["payload"]["memory"][0]["contents"]

    print("Read {} from address".format(value))

    return {
        "address": data["address"],
        "result": value
    }

@sio.event
def address_of_symbol(data):
    # main_arena
    print("address_of_symbol: ", data["symbol_name"])
    result = gdbmi.write("-data-evaluate-expression &" + data["symbol_name"])
    value = int(result[0]['payload']['value'].split(' ')[0][2:], 16)
    print(value)

    return {
        "symbol_name": data["symbol_name"],
        "result": value
    }

@sio.event
def continue_execution():
    print("Continuing execution")
    response = gdbmi.write("-exec-continue")
    if response[-1]['message'] == 'stopped' and response[-1]['payload'].get('reason', None) == 'exited-normally':
        print("Program exited normally")
        sys.exit()

    # The only time the probram breaks is when the heap is modified
    update_heap_info()

def update_heap_info():
    """
    Update info when breakpoint reached
    """
    print("Updating heap info")
    sio.emit('heap_changed')



sio.connect('http://localhost:5000')
