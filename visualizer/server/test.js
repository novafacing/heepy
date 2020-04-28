var ptrSize = 8;
var malloc_chunk = {
  mchunk_prev_size: {
    size: ptrSize,
    count: 1
  },
  mchunk_size: {
    size: ptrSize,
    count: 1
  },
  fd: {
    size: ptrSize,
    count: 1
  },
  bk: {
    size: ptrSize,
    count: 1
  },
  fd_nextsize: {
    size: ptrSize,
    count: 1
  },
  bk_nextsize: {
    size: ptrSize,
    count: 1
  }
}

for (let key in malloc_chunk) {
  console.log(key);
}
