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
response = gdbmi.write('-file-exec-file ' + sys.argv[1])

@sio.event
def read_from_address(data):
    print("ABOUT TO READ FROM {} BYTES FROM {}".format(data["size"], data["address"]))
    print(data)

    result = gdbmi.write("-data-read-memory-bytes " + str(data["address"]) + " " + str(data["size"]))
    value = result[0]["payload"]["memory"][0]["contents"]

    print("Read {} from address".format(result))

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
def continue_execution(data):
    print("Continuing execution")
    gdbmi.write("continue")

def update_heap_info():
    """
    Update info when breakpoint reached
    """
    sio.emit('heap-changed')

"""
class MallocFinishBreakpoint(gdb.FinishBreakpoint):
    "'"
    Updates heap state so that it can be redrawn.
    "'"
    def stop(self):
        update_heap_info()
        return False # Continue Execution

class MallocHookBreakpoint(gdb.Breakpoint):
    def stop(self):
        MallocFinishBreakpoint()
        return True # Pause execution
"""

sio.connect('http://localhost:5000')
