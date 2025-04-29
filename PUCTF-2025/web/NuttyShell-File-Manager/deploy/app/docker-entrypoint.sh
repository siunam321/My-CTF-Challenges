#!/bin/sh
while true; do find /app/ -type f -user www-data -group www-data -delete; sleep 1m; done &

gunicorn -w 4 app:app -b 0.0.0.0:5000 --user www-data --group www-data