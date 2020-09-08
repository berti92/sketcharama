FROM php:7.4-apache
COPY . /var/www/html/
WORKDIR /var/www/html
RUN apt update
RUN apt install -y nodejs npm
EXPOSE 8001/tcp
EXPOSE 80/tcp
ENTRYPOINT ["/var/www/html/entrypoint.sh"]
