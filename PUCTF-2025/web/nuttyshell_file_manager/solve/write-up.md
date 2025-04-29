# NuttyShell File Manager

## Background

- Description (English):

```markdown
NuttyShell File Manager Alpha version is now released! Feel free to give it a try! (Note: Many features are still in development. Stay tuned!)

Note 1: It is highly recommended you try this challenge in a local environment first. The remote challenge instance will clean up all the files in directory `/app` periodically.
Note 2: When testing your payload locally, please make sure your Python version is 3.11.
```

- Description (Chinese):

```markdown
NuttyShell File Manager Alpha 版本現已推出！歡迎試用！（註：好多功能仲整緊，敬請期待！）

注意 1：強烈建議先喺local environment 到玩呢題。個remote 題目instance 會定期清走啲喺`/app` directory 嘅files。
注意 2：當你喺你個local environment 到test 你個payload 嗰時，記住你個Python 版本要係3.11。
```

- Level: Medium

## Enumeration

User can upload and read files. However, there are some validations over both file upload and read.

In file upload, user can only upload PDF files. Unfortunately, the validations are flawed.

First, the MIME type can be bypassed via modifying the `Content-Type` header in multipart form's parameter `file`:

```python
def fileUpload():
    [...]
    file = request.files['file']
    [...]
    fileMimeType = file.mimetype
    fileContent = file.read()
    if fileMimeType != 'application/pdf' or PDF_FILE_MAGIC_NUMBER not in fileContent:
        flash('Invalid PDF file')
        return render_template('index.html')
```

To do so, we can change the `file`'s `Content-Type` to `application/pdf`:

```http
POST / HTTP/1.1
Host: localhost:5000
Content-Length: 118
Content-Type: multipart/form-data; boundary=poc

--poc
Content-Disposition: form-data; name="file"; filename="test.pdf"
Content-Type: application/pdf

foo
--poc--
```

Then, in our file's content (`fileContent`), it must include `PDF_FILE_MAGIC_NUMBER`, which is string `%PDF-`:

```python
PDF_FILE_MAGIC_NUMBER = b'%PDF-'
[...]
def fileUpload():
    [...]
    fileContent = file.read()
    if fileMimeType != 'application/pdf' or PDF_FILE_MAGIC_NUMBER not in fileContent:
        flash('Invalid PDF file')
        return render_template('index.html')
```

In here, we can simply append `%PDF-` in our file's content, like this:

```http
POST / HTTP/1.1
Host: localhost:5000
Content-Length: 118
Content-Type: multipart/form-data; boundary=poc

--poc
Content-Disposition: form-data; name="file"; filename="test.pdf"
Content-Type: application/pdf

foo%PDF-
--poc--
```

Next, it also checks our uploaded file's path is valid or not:

```python
UPLOAD_FOLDER = '/app/uploads/'
[...]
def isFilePathValid(filePath):
    absolutePathParts = filePath.parts
    if absolutePathParts[0] != '/' or absolutePathParts[1] != 'app':
        return False
    return True
[...]
def fileUpload():
    [...]
    absolutePath = Path(f'{UPLOAD_FOLDER}{file.filename}').resolve()
    if not isFilePathValid(absolutePath):
        flash('Invalid file path')
        return render_template('index.html')
```

Although we can do path traversal, it is very limited, as the first and the second path component must be `/` and `app`. Which means the file must be uploaded to directory `/app/`. With that said, we can only do path traversal inside the `/app/` directory.

The final validation is for the filename:

```python
FILENAME_REGEX_PATTERN = re.compile('^[a-zA-Z0-9\-\.]+$')
[...]
def isFilenameValid(filename):
    regexMatch = FILENAME_REGEX_PATTERN.search(filename)
    isPythonExtension = filename.endswith('.py')
    if regexMatch is None or isPythonExtension:
        return False
    return True
[...]
def fileUpload():
    [...]
    parsedFilename = absolutePath.name
    if not isFilenameValid(parsedFilename):
        flash('Filename contains illegal character(s)')
        return render_template('index.html')
```

As you can see, the filename can only contain characters lower-case `a` through `z`, upper-case `A` through `Z`, `0` through `9`, hyphen (`-`), and full-stop (`.`) character. Also, it must not be a Python file extension (`.py`).

After all the validations, it'll spawn a new process and call function `dynamicImportModule`, which dynamically imports module `utils` and call function `saveFile` in the `utils` module:

```python
def dynamicImportModule(module, *args):
    importedModule = __import__(module)
    if module == 'utils':
        importedModule.saveFile(*args)
[...]
def fileUpload():
    [...]
    try:
        # we save the file in another process for optimization
        with concurrent.futures.ProcessPoolExecutor() as executor:
            executor.submit(dynamicImportModule, 'utils', absolutePath, fileContent)
    except:
        flash('Unable to save the file')
        return render_template('index.html')
```

In `utils.py`, we can see that function `saveFile` will simply write the file's content into path `/app/uploads/` (`UPLOAD_FOLDER`):

```python
def saveFile(filePath, fileContent):
    with open(filePath, 'wb') as file:
        file.write(fileContent)
```

To briefly sum up, this web application has a limited arbitrary file upload vulnerability, where we can only upload files inside path `/app/` and cannot upload Python files.

In file read, it also has some validations, which are the same as the file upload. So we can only read files inside path `/app/` and cannot read Python files.

## Exploitation

If we setup the local testing environment, we can see that `__pycache__` exists in directory `/app/`:

```shell
/app $ ls -lah
total 44K    
drwxr-xr-x    1 www-data www-data    4.0K Feb 16 05:33 .
drwxr-xr-x    1 root     root        4.0K Feb 16 05:33 ..
drwxr-xr-x    2 www-data www-data    4.0K Feb 16 05:41 __pycache__
-rw-r--r--    1 www-data www-data    3.4K Feb  1 06:16 app.py
dr-xr-xr-x    1 www-data www-data    4.0K Jan 18 09:36 static
dr-xr-xr-x    1 www-data www-data    4.0K Jan 18 08:57 templates
drwxr-xr-x    1 www-data www-data    4.0K Feb 16 05:41 uploads
-rw-r--r--    1 www-data www-data     132 Jan 19 09:04 utils.py
```

Since we cannot upload files into directory `static` and `templates`, `__pycache__` is worth investigating.

Inside that `__pycache__` directory, we can see the following files:

```shell
/app $ ls -lah __pycache__/
total 24K    
drwxr-xr-x    2 www-data www-data    4.0K Feb 16 05:41 .
drwxr-xr-x    1 www-data www-data    4.0K Feb 16 05:33 ..
-rw-r--r--    1 www-data www-data    5.8K Feb 16 05:33 app.cpython-311.pyc
-rw-r--r--    1 www-data www-data     541 Feb 16 05:41 utils.cpython-311.pyc
```

Turns out, whenever Python executes a `.py` file, the Python compiler will compile the script into Python bytecode (Extension `.pyc`), which will then interpreted and executed by Python virtual machine. For more details about Python bytecode, we can read this blog post: [Python bytecode analysis (1)](https://nowave.it/python-bytecode-analysis-1.html).

Now here's the idea, what if we overwrite those compiled bytecode files?

According to [PEP 3147's Python behavior](https://peps.python.org/pep-3147/#python-behavior), if the executing Python script import a module a **second time** in a **different process** (Assuming it's import module `utils`), it'll first check `utils.py` exists or not. If exist, check `__pycache__/utils.<magic>.pyc` exists or not. If exist, load the compiled bytecode at path `__pycache__/utils.<magic>.pyc`.

If you don't understand the above explanation, PEP 3147 also provided a [flowchart](https://peps.python.org/pep-3147/#flow-chart).

With that said, if we overwrite module `utils`'s compiled bytecode file, we should be able to execute arbitrary Python code!

To do so, I've written a Python solve script to automatically read the original bytecode file, modify it with our own RCE payload, overwrite the original one, and trigger the RCE payload.

[Solve script](solve.py)

## Conclusion

What we've learned:

1. Harden arbitrary file write in Python to Remote Code Execution (RCE) via overwriting Python generated bytecode pyc file

## Why I Made This Challenge

- Inspired from [https://blog.convisoappsec.com/en/from-arbitrary-file-write-to-rce-in-restricted-rails-apps/](https://blog.convisoappsec.com/en/from-arbitrary-file-write-to-rce-in-restricted-rails-apps/)