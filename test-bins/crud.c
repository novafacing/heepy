#include <stdlib.h>
#include <stdio.h>
#include <stdbool.h>


struct ptr_size {
    void * ptr;
    size_t sz;
};

enum option {
    ALLOC = 0,
    DEALLOC = 1,
    WRITE = 2,
    PRINT = 3,
    EXIT = 4
};

enum option prompt(void) {
    printf("Select an action:\n1. Allocate\n2. Deallocate\n3. Write\n4. Print\n5. Exit\n> ");
    enum option o = (enum option)(getc(stdin) - 0x31);
    getc(stdin);
    return o;
}

struct ptr_size g_allocs[0xff];

void invalid(void) {
    printf("Invalid selection!\n");
}

void flush(void) {
    while ((getchar()) != '\n');
}

void print(void) {
    for (unsigned i = 0x0; i < 0xff; i++) {
        if (g_allocs[i].ptr != NULL) {
            struct ptr_size c = g_allocs[i];
            printf("(%x)-> [loc: %p - sz: 0x%lx]\n", i, c.ptr, c.sz);
            printf("{");
            for (size_t s = 0; s < (c.sz <= 128 ? c.sz : 128); s++) {
                if (s % 8 == 0) {
                    printf("\n  ");
                }
                printf("%x", ((char *)c.ptr)[s]);
            }
            printf("\n}\n");
        }
    }
}

void write(void) {
    printf("Writable chunks:\n");
    for (unsigned i = 0x0; i < 0xff; i++) {
        if (g_allocs[i].ptr != NULL) {
            printf("(%x) ", i);
        }
    }
    printf("Write to which chunk?\n> ");
    size_t chunk = 0;
    scanf(" %ld", &chunk);
    flush();
    if (chunk > 0xff || g_allocs[chunk].ptr == NULL) {
        invalid();
        return;
    }
    printf("Input:\n> ");
    fgets((char *)g_allocs[chunk].ptr, g_allocs[chunk].sz, stdin);
    return;
}

void dealloc(void) {
    printf("Allocated chunks:\n");
    for (unsigned i = 0x0; i < 0xff; i++) {
        if (g_allocs[i].ptr != NULL) {
            printf("(%x) ", i);
        }
    }
    printf("\nDeallocate which chunk?\n> ");
    size_t chunk = 0;
    scanf(" %ld", &chunk);
    flush();
    if (chunk > 0xff || g_allocs[chunk].ptr == NULL) {
        invalid();
        return;
    }
    free(g_allocs[chunk].ptr);
    g_allocs[chunk].ptr = NULL;
    return;
}

void alloc(void) {
    size_t chunk = 0;
    for (unsigned i = 0x0; i < 0xff; i++) {
        if (g_allocs[i].ptr == NULL) {
            chunk = i;
            break;
        }
    }
    printf("Allocation size?\n> ");
    size_t alloc_size = 0;
    scanf(" %ld", &alloc_size);
    flush();
    g_allocs[chunk].ptr = malloc(alloc_size);
    g_allocs[chunk].sz = alloc_size;
    printf("Allocated 0x%lx bytes at %p. Index 0x%lx.\n", 
            g_allocs[chunk].sz, g_allocs[chunk].ptr, chunk);
    return;
}

void init(void) {
    for (unsigned i = 0; i < 0xff; i++) {
        g_allocs[i].ptr = NULL;
        g_allocs[i].sz = 0;
    }
}

int main() {
    init();
    while(true) {
        enum option o = prompt();
        printf("%d\n", o);
        switch(o) {
            case ALLOC:
                alloc();
                break;
            case DEALLOC:
                dealloc();
                break;
            case WRITE:
                write();
                break;
            case PRINT:
                print();
                break;
            case EXIT:
                exit(0);
                break;
            default:
                invalid();
                break;
        }
    }
}
