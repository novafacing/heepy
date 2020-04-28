#include<stdio.h>
#include<stdlib.h>

int main() {
    char * allocated_memory[100];
    int choice;
    int index;
    int size;

    while(1) {
        printf("1) Allocate\n2) Free\n3) Write\n4) Read\n> ");
        scanf("%d", &choice);

        if(choice == 1) {
            printf("index (0-99): ");
            scanf("%d", &index);
            printf("size: ");
            scanf("%d", &size);
            allocated_memory[index] = malloc(size);
        } else if(choice == 2) {
            printf("index (0-99): ");
            scanf("%d", &index);
            free(allocated_memory[index]);
        } else if(choice == 3) {
            printf("index (0-99): ");
            scanf("%d", &index);
            getchar();
            printf("buffer: ");
            scanf("%s", allocated_memory[index]);
        } else if(choice == 4) {
            printf("index (0-99): ");
            scanf("%d", &index);
            printf("buffer: %s\n", allocated_memory[index]);
        } else {
            break;
        }
    }
}
