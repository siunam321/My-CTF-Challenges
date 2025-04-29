#include <stdio.h>

int main() {
    FILE *file;
    char line[100];

    file = fopen("/flag.txt", "r");

    if (file == NULL) {
        printf("[-] Error opening the flag file. Please contact admin if this happened in the remote instance during the CTF.\n");
        return 1;
    }

    while (fgets(line, sizeof(line), file)) {
        printf("%s", line);
    }

    fclose(file);

    return 0;
}