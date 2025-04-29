#!/usr/bin/env python3
import secrets
import re
import concurrent.futures
import os
from pathlib import Path
from flask import Flask, flash, request, render_template, make_response

UPLOAD_FOLDER = '/app/uploads/'
PDF_FILE_MAGIC_NUMBER = b'%PDF-'
FILENAME_REGEX_PATTERN = re.compile('^[a-zA-Z0-9\-\.]+$')
MAXIMUM_1MB_FILESIZE = 1 * 1024 * 1024
PYCACHE_DIRECTORY_PATH = '/app/__pycache__/'

app = Flask(__name__)
app.secret_key = secrets.token_bytes(32)
app.config['MAX_CONTENT_LENGTH'] = MAXIMUM_1MB_FILESIZE

def cleanupCacheFiles():
    for filename in os.listdir(PYCACHE_DIRECTORY_PATH):
        filePath = os.path.join(PYCACHE_DIRECTORY_PATH, filename)
        if not os.path.isfile(filePath):
            continue
        if not filePath.endswith('.pyc'):
            continue

        os.unlink(filePath)

def dynamicImportModule(module, *args):
    importedModule = __import__(module)
    if module == 'utils':
        importedModule.saveFile(*args)

def isFilePathValid(filePath):
    absolutePathParts = filePath.parts
    if absolutePathParts[0] != '/' or absolutePathParts[1] != 'app':
        return False
    return True

def isFilenameValid(filename):
    regexMatch = FILENAME_REGEX_PATTERN.search(filename)
    isPythonExtension = filename.endswith('.py')
    if regexMatch is None or isPythonExtension:
        return False
    return True

def fileRead():
    filename = request.args['filename']
    if len(filename) == 0:
        flash('Please provide a filename')
        return render_template('index.html')

    absolutePath = Path(f'{UPLOAD_FOLDER}{filename}').resolve()
    if not isFilePathValid(absolutePath):
        flash('Invalid file path')
        return render_template('index.html')

    parsedFilename = absolutePath.name
    if not isFilenameValid(parsedFilename):
        flash('Filename contains illegal character(s)')
        return render_template('index.html')

    try:
        with open(absolutePath, 'rb') as file:
            response = make_response(file.read())
            response.headers['Content-Type'] = 'text/plain'
            return response
    except:
        flash('Unable to read the file')
        return render_template('index.html')

def fileUpload():
    if 'file' not in request.files:
        flash('Missing file content')
        return render_template('index.html')
    
    file = request.files['file']
    if file.filename == '':
        flash('Please select a file')
        return render_template('index.html')
    
    fileMimeType = file.mimetype
    fileContent = file.read()
    if fileMimeType != 'application/pdf' or PDF_FILE_MAGIC_NUMBER not in fileContent:
        flash('Invalid PDF file')
        return render_template('index.html')

    absolutePath = Path(f'{UPLOAD_FOLDER}{file.filename}').resolve()
    if not isFilePathValid(absolutePath):
        flash('Invalid file path')
        return render_template('index.html')
    
    parsedFilename = absolutePath.name
    if not isFilenameValid(parsedFilename):
        flash('Filename contains illegal character(s)')
        return render_template('index.html')
    
    if parsedFilename.endswith('.pyc'):
        cleanupCacheFiles()

    try:
        # we save the file in another process for optimization
        with concurrent.futures.ProcessPoolExecutor() as executor:
            executor.submit(dynamicImportModule, 'utils', absolutePath, fileContent)
    except:
        flash('Unable to save the file')
        return render_template('index.html')

    flash('Your file is uploaded')
    return render_template('index.html')

@app.route('/', methods=['GET', 'POST'])
def index():
    parameters = request.args
    if request.method == 'GET' and 'filename' not in parameters:
        return render_template('index.html')
    if request.method == 'GET' and 'filename' in parameters:
        return fileRead()
    if request.method == 'POST':
        return fileUpload()

if __name__ == '__main__':
    app.run('0.0.0.0', debug=False)