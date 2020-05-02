#!/usr/bin/env python3
from pygdbmi.gdbcontroller import GdbController
import pygdbmi
import socketio
import time
import sys
import random
import subprocess
import os

sio = socketio.Client()

debug = False  # CHANGE THIS TO PAUSE ON PROGRAM EXIT

if os.environ.get("TMUX") is None:
    print("Must be in a tmux session. Please run ./main.sh")
    sys.exit()

if len(sys.argv) < 2:
    print(
        "Usage: {} ./binary ./libc\nAlso make sure the server is running.".format(
            sys.argv[0]
        )
    )
    sys.exit()

gdbmi = GdbController()

if len(sys.argv) >= 3:
    print("Setting libc to {}".format(sys.argv[2]))
    response = gdbmi.write("set environment LD_PRELOAD " + sys.argv[2])

# Hacky way to determine which tty is being used
num = str(random.randint(100000, 1000000))
p = subprocess.Popen(["tmux", "new-window", "sleep {}".format(num)])

time.sleep(1)
tty = "/dev/" + str(
    subprocess.check_output(
        "ps ax | grep 'sleep {}' | grep -v tmux | grep -v grep".format(num), shell=True
    ).split()[1],
    "utf8",
)


def kill_process():
    if debug:
        print("Program exited. Waiting for input.")
        input()
    os.system("kill $(pgrep --full -x 'sleep {}')".format(num))


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
    print("sizeof: {}".format(data))
    result = gdbmi.write('-data-evaluate-expression "sizeof(' + data["var"] + ')"')

    return {"result": result[0]["payload"]["value"]}


@sio.event(namespace="/gef")
def libc_version():
    print("libc_version")
    result = gdbmi.write('-data-evaluate-expression "(char*) &__libc_version"')

    result = result[0]["payload"]["value"].split(" ")[-1][1:-1]
    return {"result": result}


@sio.event(namespace="/gef")
def evaluate_expression(data):
    print("evaluate_expression: {}".format(data))
    result = gdbmi.write('-data-evaluate-expression "' + data["expression"] + '"')

    return {"result": result[0]["payload"]["value"]}


@sio.event(namespace="/gef")
def read_from_address(data):
    print("read_from_address: {}".format(data))

    result = gdbmi.write(
        "-data-read-memory-bytes " + str(hex(data["address"])) + " " + str(data["size"])
    )

    value = result[0]["payload"]["memory"][0]["contents"]
    return {"address": data["address"], "result": value}


@sio.event(namespace="/gef")
def address_of_symbol(data):
    print("address_of_symbol: {}".format(data))

    result = gdbmi.write("-data-evaluate-expression &" + data["symbol_name"])
    # This is hex b/c it's a symbol. weird...
    value = int(result[0]["payload"]["value"].split(" ")[0][2:], 16)

    return {"symbol_name": data["symbol_name"], "result": value}


@sio.event(namespace="/gef")
def continue_execution():
    print("continue_execution")
    response = gdbmi.write("-exec-continue")

    if (
        response[-1]["message"] == "stopped"
        and response[-1]["payload"].get("reason", None) == "exited-normally"
    ):
        print("Program exited normally")
        kill_process()
        sio.disconnect()
        sys.exit()
    if (
        response[-1]["message"] == "error"
        and response[-1]["payload"].get("msg", None) == "The program is not being run."
    ):
        print("Program exited")
        kill_process()
        sio.disconnect()
        sys.exit()

    while response[-1]["message"] == "running":
        try:
            response = gdbmi.write("", timeout_sec=1)
        except pygdbmi.gdbcontroller.GdbTimeoutError:
            pass

    for line in response:
        if (
            line["message"] == "stopped"
            and line["payload"].get("reason", None) == "exited-normally"
        ) or (
            line["message"] == "error"
            and line["payload"].get("msg", None) == "The program is not being run."
        ):
            print("Program exited")
            kill_process()
            sio.disconnect()
            sys.exit()

    print(response)

    data = {
        "called-function": None,
        "rax-after-call": None,
        "rdi-before-call": None,
        "rsi-before-call": None,
    }

    bp_at = None
    print_at = None

    for i, line in enumerate(response):
        if line["message"] == "breakpoint-modified":
            bp_at = i
        if (
            bp_at is not None
            and line["type"] == "console"
            and line["payload"]
            and isinstance(line["payload"], str)
            and line["payload"][0] == "$"
        ):
            # Yeah, this be lazy and might(?) have false positives
            print_at = i
            break

    if bp_at is not None and print_at is not None:
        try:
            if response[bp_at]["payload"]["at"] == "<malloc>":
                print("We're at the end of a malloc!")
                result = gdbmi.write("-data-evaluate-expression $rax")
                rax = int(result[0]["payload"]["value"])

                data["called-function"] = "malloc"
                data["rax-after-call"] = rax

                rdi = int(response[print_at]["payload"].split(" ")[-1][:-2])
                data["rdi-before-call"] = rdi
            if response[bp_at]["payload"]["at"] == "<free>":
                print("We're at the end of a free!")
                result = gdbmi.write("-data-evaluate-expression $rax")
                rax = int(result[0]["payload"]["value"])

                data["called-function"] = "free"
                data["rax-after-call"] = rax

                rdi = int(response[print_at]["payload"].split(" ")[-1][:-2])
                data["rdi-before-call"] = rdi
            if response[bp_at]["payload"]["at"] == "<realloc>":
                print("We're at the end of a realloc!")
                result = gdbmi.write("-data-evaluate-expression $rax")
                rax = int(result[0]["payload"]["value"])

                data["called-function"] = "realloc"
                data["rax-after-call"] = rax

                rdi = int(response[print_at]["payload"].split(" ")[-1][:-2])
                data["rdi-before-call"] = rdi
                rsi = int(response[print_at + 1]["payload"].split(" ")[-1][:-2])
                data["rsi-before-call"] = rsi
            if response[bp_at]["payload"]["at"] == "<calloc>":
                print("We're at the end of a calloc!")
                result = gdbmi.write("-data-evaluate-expression $rax")
                rax = int(result[0]["payload"]["value"])

                data["called-function"] = "calloc"
                data["rax-after-call"] = rax

                rdi = int(response[print_at]["payload"].split(" ")[-1][:-2])
                data["rdi-before-call"] = rdi
                rsi = int(response[print_at + 1]["payload"].split(" ")[-1][:-2])
                data["rsi-before-call"] = rsi
        except IndexError:
            pass

    if data["called-function"] == None:
        # This is an emergency fallback that is still sometimes needed.
        print("Program exited")
        kill_process()
        sio.disconnect()
        sys.exit()

    # The only time the probram breaks is when the heap is modified
    update_heap_info(data)


def update_heap_info(data):
    """
    Update info when breakpoint reached
    """
    print("emitting heap_changed: {}".format(data))
    sio.emit("heap_changed", data, namespace="/gef")


sio.connect("http://localhost:3000/gef", namespaces=["/gef"])
