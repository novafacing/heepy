## GEF 


allocate: {
    emits: {
        name: "allocate"
        "addr",
        "request_size"
    },
    expect-reply: {
        "addr",
        "size"
    },
    emit-reply: {
        name: "allocate-data"
        "addr",
        "contents"
    },
    expect-reply: {
        "ok"
    }
},
deallocate: {
    emits: {
        "addr"
    },
    expect-reply: {
        "addr",
        "size"
    },
    emit-reply: {
        "containing-freelist",
        "contents"
    },
    expect-reply: {
        "ok"
    }
},
write: {
    emits: {
        "addr",
        "size",
        "contents"
    },
    expect-reply: {
        "ok"
    }
}

## FRONTEND

## SERVER

on: {
    allocate: {
        expect: {
           addr,
           request_size
        },
        emit-reply: {
            addr, <- calculated address of heap chunk header
            size <- calculated size of chunk with header size included
        },
        expect-reply: {
            addr <-- 
            contents
        },
        emit-reply: {
            ok
        }
    },
    deallocate: {
        expect: {
            addr
        },
        emit-reply: {
            addr,
            size
        },
        expect-reply: {
            containing-freelist, <- this is a freelist name from malloc_state. GEF can request the list of names probably if we need that
            contents <- Using addr + size, deliver contents so server can parse next/prev/size/state info
        },
        emit-reply: {
            ok
        }
    },
    write: {
        expect: {
            addr,
            size,
            contents
        }
        emit-reply: {
            ok
        }
    }
}
