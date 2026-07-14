# Khatt Capital marketing website — статика, контейнер для Spaceship Hyperlift.
#
# Чистый nginx, без своего кода: index.html/styles.css/script.js/assets/
# копируются как есть и раздаются напрямую. Порт 8080 — по умолчанию для
# приложений на Hyperlift Micro (см. APPLICATION_PORT в настройках сервиса).

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css script.js /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 8080
