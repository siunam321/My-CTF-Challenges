#!/bin/bash

mysqld_safe &

mysql_ready() {
    mysqladmin ping --socket=/run/mysqld/mysqld.sock --user=root --password=root > /dev/null 2>&1
}

while !(mysql_ready)
do
    echo "[*] Waiting MySQL service to be up..."
    sleep 3
done

exec php-fpm & nginx &

# NOT related to the challenge.
# a dirty way to change the Unix socket file's owner. idk how to do this in a better way
sleep 5 && chown www-data:www-data /var/run/php-fpm.sock

tail -F /var/log/nginx/access.log /var/log/nginx/error.log