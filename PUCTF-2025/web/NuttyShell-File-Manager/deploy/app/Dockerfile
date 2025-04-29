FROM python:3.11-alpine

WORKDIR /app
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

COPY ./readflag.c /readflag.c
RUN apk update && apk add gcc musl-dev && gcc /readflag.c -o /readflag && chmod 4755 /readflag && rm /readflag.c

COPY ./docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY ./src .
RUN pip3 install requests flask gunicorn

# user www-data can only write files into path `/app/uploads`
RUN chmod -R 1777 /app && \
    chmod -R 755 /app/templates /app/static /app/app.py /app/utils.py

RUN echo -n 'PUCTF25{wheN_bY7eCodE_Bi7e5_B4CK_8c531a651dd37d09b4b70dd619374a7b}' > /flag.txt
RUN chmod 400 /flag.txt
RUN chown root:root /flag.txt

RUN adduser -S www-data -G www-data -u 1000
EXPOSE 5000
CMD ["/bin/sh", "-c", "/docker-entrypoint.sh"]