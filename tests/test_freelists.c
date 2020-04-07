#include <stdio.h>
#include <stdlib.h>

int main() {
    void * a = malloc(0x20);
    void * b = malloc(0x20);
    void * c = malloc(0x20);
    void * d = malloc(0x20);
    void * e = malloc(0x20);
    free(a);
    free(b);
    free(c);
    void * f = malloc(0x20);
    free(d);
    free(e);
    free(f);
}
