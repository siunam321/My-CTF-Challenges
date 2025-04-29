#!/usr/bin/env python3

def saveFile(filePath, fileContent):
    with open(filePath, 'wb') as file:
        file.write(fileContent)
