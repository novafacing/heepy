#define _GNU_SOURCE

#include <stdio.h>
#include <pthread.h>
#include <dlfcn.h>
#include "trace_malloc.h"
//
// THIS DOENSN'T WORK FOR new/delete/etc/cpp things :)
// More methods will need to be hooked to make that work
//

#define chunk2mem(p) ((void*)((char*)(p) + 2*sizeof(size_t)))
#define mem2chunk(mem) ((mchunkptr)((char*)(mem) - 2*sizeof(size_t)))

void print_free_chunk(void * mem) {
    mchunkptr chunk = mem2chunk(mem);

    printf("-----------------------\n");
    printf("Chunk @ %p (%p)\n", mem, chunk);
    printf("-----------------------\n");
    printf("fd: %p\n", chunk->fd);
    printf("bk: %p\n", chunk->bk);
    printf("-----------------------\n");
}

void print_freelist_from_freed(void * mem) {
    print_free_chunk(mem);
    mchunkptr next = mem2chunk(mem);
    printf("--------------------Printing Freelist----------------------\n");
    while(next->fd) {
        next = next->fd;
        print_free_chunk(next);
    }
    printf("--------------------Done     Printing----------------------\n");
}

void *malloc(size_t size)
{

    void *p = NULL;
    fprintf(stderr, "malloc(%d) = ", size);
    p = __libc_malloc(size);
    fprintf(stderr, "%p\n", p);
    return p;
}

void free(void *ptr)
{
    // THIS DOESNT WORK
    //void * arena = dlsym(RTLD_DEFAULT, "main_arena");
    //if (NULL == arena) {
        //fprintf(stderr, "Error in `dlsym`: %s\n", dlerror());
    //}
    //printf("main_arena: %p\n", arena);

    fprintf(stderr, "free(%p)", ptr);
    __libc_free(ptr);
    fprintf(stderr, "\n");
    print_freelist_from_freed(ptr);
}

void *calloc(size_t nmemb, size_t size)
{
    void *p = NULL;
    fprintf(stderr, "calloc(%d, %d) = ", nmemb, size);
    p = __libc_calloc(nmemb, size);
    fprintf(stderr, "%p\n", p);
    return p;
}

void *realloc(void * ptr, size_t size)
{
    void *p = NULL;
    fprintf(stderr, "realloc(%p, %d) = ", ptr, size);
    p = __libc_realloc(ptr, size);
    fprintf(stderr, "%p\n", p);
    return p;
}

/*
   void *reallocarray(void * ptr, size_t nmemb, size_t size)
   {
// reallocarray actually calls realloc(pyr, nmemb*size), so we don't need to hook it
void *p = NULL;
fprintf(stderr, "reallocarray(%p, %d, %d) = ", ptr, nmemb, size);
p = __libc_reallocarray(ptr, nmemb, size);
fprintf(stderr, "%p\n", p);
return p;
}
*/
