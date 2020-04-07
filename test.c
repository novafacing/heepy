#define _GNU_SOURCE

#include <dlfcn.h>
#include <stdio.h>
int main() {
    void * arena = dlsym(RTLD_DEFAULT, "main_arena");
    if (NULL == arena) {
        fprintf(stderr, "Error in `dlsym`: %s\n", dlerror());
    }

    printf("main_arena: %p\n", arena);
}
