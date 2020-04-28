#!/usr/bin/env python3
from pygdbmi.gdbcontroller import GdbController
import pygdbmi
import socketio
import time
import sys
import random
import subprocess

sio = socketio.Client()


# recieves 'read-from-address' (addr, n_bytes)
# recieves 'address-of-symbol' (symbol_name)
# recieves 'continue-execution'
# emits 'heap-changed'
if len(sys.argv) < 2:
    print(
        "Usage: {} ./binary\nAlso make sure the server is running.".format(sys.argv[0])
    )
    sys.exit()

gdbmi = GdbController()

# TODO: Come up with a better way to determine a TTY. Currently just sleeping in a new window lol
# Open a terminal. Run `tty`, then change the tty below V
# Then run `sleep 100000` in that terminal.
num = str(random.randint(100000, 1000000))
p = subprocess.Popen(["xterm", "-e", "sleep {}".format(num)])
time.sleep(1)
tty = "/dev/" + str(
    subprocess.check_output(
        "ps ax | grep 'sleep {}' | grep -v xterm | grep -v grep".format(num), shell=True
    ).split()[1],
    "utf8",
)

response = gdbmi.write("tty {}".format(tty))

response = gdbmi.write("-file-exec-and-symbols " + sys.argv[1])
response = gdbmi.write("start")

# Break after each heap changing thing happens
response = gdbmi.write("-break-insert malloc")
bp_num = response[0]["payload"]["bkpt"]["number"]
response = gdbmi.write('-break-commands {} "print/ud $rdi" "fin"'.format(bp_num))

response = gdbmi.write("-break-insert free")
bp_num = response[0]["payload"]["bkpt"]["number"]
response = gdbmi.write('-break-commands {} "print/ud $rdi" "fin"'.format(bp_num))

response = gdbmi.write("-break-insert calloc")
bp_num = response[0]["payload"]["bkpt"]["number"]
response = gdbmi.write(
    '-break-commands {} "print/ud $rdi" "print/ud $rsi" "fin"'.format(bp_num)
)

response = gdbmi.write("-break-insert realloc")
bp_num = response[0]["payload"]["bkpt"]["number"]
response = gdbmi.write(
    '-break-commands {} "print/ud $rdi" "print/ud $rsi" "fin"'.format(bp_num)
)


@sio.event(namespace="/gef")
def sizeof(data):
    print("sizeof: ", data["var"])
    result = gdbmi.write('-data-evaluate-expression "sizeof(' + data["var"] + ')"')

    return {"result": result[0]["payload"]["value"]}


@sio.event(namespace="/gef")
def libc_version():
    print("libc_version")
    result = gdbmi.write('-data-evaluate-expression "(char*) &__libc_version"')

    result = result[0]["payload"]["value"].split(" ")[-1][1:-1]
    print(result)
    return {"result": result}


@sio.event(namespace="/gef")
def evaluate_expression(data):
    print("evaluating: ", data["expression"])
    result = gdbmi.write('-data-evaluate-expression "' + data["expression"] + '"')

    return {"result": result[0]["payload"]["value"]}


@sio.event(namespace="/gef")
def read_from_address(data):
    print(
        "ABOUT TO READ FROM {} BYTES FROM {}".format(data["size"], hex(data["address"]))
    )

    result = gdbmi.write(
        "-data-read-memory-bytes " + str(hex(data["address"])) + " " + str(data["size"])
    )
    value = result[0]["payload"]["memory"][0]["contents"]

    print("Read {} from address".format(value))

    return {"address": data["address"], "result": value}


@sio.event(namespace="/gef")
def address_of_symbol(data):
    # main_arena
    print("address_of_symbol: ", data["symbol_name"])
    result = gdbmi.write("-data-evaluate-expression &" + data["symbol_name"])
    # This is hex b/c it's a symbol. weird...
    value = int(result[0]["payload"]["value"].split(" ")[0][2:], 16)

    return {"symbol_name": data["symbol_name"], "result": value}


@sio.event(namespace="/gef")
def continue_execution():
    print("Continuing execution")
    response = gdbmi.write("-exec-continue")
    if (
        response[-1]["message"] == "stopped"
        and response[-1]["payload"].get("reason", None) == "exited-normally"
    ):
        print("Program exited normally; waiting for input")
        input()
        p.kill()
        sio.disconnect()
        sys.exit()
    if (
        response[-1]["message"] == "error"
        and response[-1]["payload"].get("msg", None) == "The program is not being run."
    ):
        print("Program exited; waiting for input")
        input()
        p.kill()
        sio.disconnect()
        sys.exit()

    while response[-1]["message"] == "running":
        try:
            response = gdbmi.write("", timeout_sec=1)
        except pygdbmi.gdbcontroller.GdbTimeoutError:
            pass

    data = {
        "called-function": None,
        "rax-after-call": None,
        "rdi-before-call": None,
        "rsi-before-call": None,
    }

    bp_at = None

    for i, line in enumerate(response):
        if line["message"] == "breakpoint-modified":
            bp_at = i
            break

    if bp_at is not None:
        try:
            if response[bp_at]["payload"]["at"] == "<malloc>":
                print("We're at the end of a malloc!")
                result = gdbmi.write("-data-evaluate-expression $rax")
                rax = int(result[0]["payload"]["value"])

                data["called-function"] = "malloc"
                data["rax-after-call"] = rax

                # TODO: NATHAN NEEDS TO LOOK AT THIS
                rdi = int(response[bp_at + 4]["payload"].split(" ")[-1][:-2])
                # rdi = int(response[bp_at
                data["rdi-before-call"] = rdi

                print(hex(rdi))
                print(hex(rax))
            if response[bp_at]["payload"]["at"] == "<free>":
                print("We're at the end of a free!")
                result = gdbmi.write("-data-evaluate-expression $rax")
                rax = int(result[0]["payload"]["value"])

                data["called-function"] = "free"
                data["rax-after-call"] = rax

                rdi = int(response[bp_at + 4]["payload"].split(" ")[-1][:-2])
                data["rdi-before-call"] = rdi

                print(hex(rdi))
                print(hex(rax))
            if response[bp_at]["payload"]["at"] == "<realloc>":
                print("We're at the end of a realloc!")
                result = gdbmi.write("-data-evaluate-expression $rax")
                rax = int(result[0]["payload"]["value"])

                data["called-function"] = "realloc"
                data["rax-after-call"] = rax

                rdi = int(response[bp_at + 4]["payload"].split(" ")[-1][:-2])
                data["rdi-before-call"] = rdi
                rsi = int(response[bp_at + 5]["payload"].split(" ")[-1][:-2])
                data["rsi-before-call"] = rsi

                print(hex(rdi))
                print(hex(rsi))
                print(hex(rax))
            if response[bp_at]["payload"]["at"] == "<calloc>":
                print("We're at the end of a calloc!")
                result = gdbmi.write("-data-evaluate-expression $rax")
                rax = int(result[0]["payload"]["value"])

                data["called-function"] = "calloc"
                data["rax-after-call"] = rax
                # print(response)

                rdi = int(response[bp_at + 4]["payload"].split(" ")[-1][:-2])
                data["rdi-before-call"] = rdi
                rsi = int(response[bp_at + 5]["payload"].split(" ")[-1][:-2])
                data["rsi-before-call"] = rsi

                print(hex(rdi))
                print(hex(rsi))
                print(hex(rax))
        except IndexError:
            pass

    # The only time the probram breaks is when the heap is modified
    update_heap_info(data)


def update_heap_info(data):
    """
    Update info when breakpoint reached
    """
    print("Updating heap info")
    sio.emit("heap_changed", data)


sio.connect("http://localhost:3000/gef", namespaces=["/gef"])
