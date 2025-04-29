FROM php:8.4-fpm

RUN apt update && \
    apt install -y nginx default-mysql-client default-mysql-server

RUN docker-php-source extract && \
    docker-php-ext-install pdo_mysql mysqli && \
    docker-php-source delete && \
    mysql_install_db --user=mysql --datadir=/var/lib/mysql && \
    sh -c 'mysqld_safe &' && \
    sleep 5s && \
    mysqladmin -uroot password 'root'

COPY ./config/default.conf /etc/nginx/conf.d
COPY ./config/docker-php-ext-mysqli.ini /usr/local/etc/php/conf.d
COPY ./config/docker-php-ext-pdo_mysql.ini /usr/local/etc/php/conf.d
COPY ./config/php.ini /usr/local/etc/php/php.ini

RUN sed -i 's#listen = 127.0.0.1:9000#listen = /var/run/php-fpm.sock#' /usr/local/etc/php-fpm.d/www.conf && \
    rm /usr/local/etc/php-fpm.d/zz-docker.conf /usr/local/etc/php-fpm.d/www.conf.default

COPY ./src /var/www/html

RUN chown -R www-data:www-data /var/www/html && \
    rm /var/www/html/index.nginx-debian.html

COPY ./data/db.sql /var/db.sql

COPY ./docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

RUN sh -c 'mysqld_safe &' && \
    sleep 5s && \
    mysqladmin -uroot password 'root' && \ 
    mysql -e "source /var/db.sql;" -uroot -proot

WORKDIR /var/www/html
ENTRYPOINT [ "/docker-entrypoint.sh" ]