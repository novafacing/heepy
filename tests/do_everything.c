#include <stdio.h>
#include <stdlib.h>

int main() {
    void * a = malloc(0x20);
    free(a);
    a = calloc(0x20, 2);
    a = realloc(a, 0x50);
    a = reallocarray(a, 0x30, 4);
    free(a);
}
