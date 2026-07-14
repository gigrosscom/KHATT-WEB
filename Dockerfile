# Khatt Capital marketing website — статика, контейнер для Spaceship Hyperlift.
#
# Чистый nginx, без своего кода: index.html/styles.css/script.js/assets/
# копируются как есть и раздаются напрямую. Порт 8080 — по умолчанию для
# приложений на Hyperlift Micro (см. APPLICATION_PORT в настройках сервиса).

FROM nginx:alpine

# На контейнерах с ограниченной квотой CPU (0.25 vCPU на Hyperlift Micro)
# автоопределение nginx ("worker_processes auto") видит физические ядра
# хост-машины, а не выделенную контейнеру долю, и может запустить сотни
# worker-процессов — это забивает те же 0.5GB RAM и вызывает нестабильность.
# Явно фиксируем 1 процесс — с запасом достаточно для статического сайта.
RUN sed -i 's/worker_processes.*;/worker_processes 1;/' /etc/nginx/nginx.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css script.js /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 8080
