# Конфиг Nginx
#### В основном этот мануал больше всего как объяснение функций, которые помогут разобраться нужны ли вам какие-то параметры или изменить.
> sendfile - нужен для более быстрого и эффективного передачи файлов. **Оставить как есть.**
```sh
sendfile on;
```
> client_max_body_size - нужен для ограничения загружаемого файла для клиента. **Можно изменить, но может работать нестабильно.**
```sh
client_max_body_size 3G;
```
> large_client_header_buffers - директива, которая задаёт максимальное число и размер буферов для чтения большого заголовка запроса клиента. **Можно поэкспериментировать.**
```sh
large_client_header_buffers 4 16k;
```
> keepalive_timeout - определяет максимальное время поддержания keepalive-соединения, если пользователь по нему не делает запросы. **Можно поэкспериментировать.**
```sh
keepalive_timeout 60s;
```
> add_header - нужны для безопасности приложения, ограничив определенные запросы. **Оставить как есть.**
```sh
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'none';" always;
add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
add_header Pragma "no-cache";
add_header Cross-Origin-Resource-Policy "same-origin" always;
```
> server_tokens - нужна для скрытия версии сервера **Можно поэкспериментировать.**
```sh
server_tokens off;
```
> location - используется для того, чтобы веб-сервер мог обрабатывать запросы для разных ресурсов и URI родительского сервера. С помощью этого блока администратор может разделить пространство URI требуемым образом. **Оставить как есть, кроме location /**
```sh
location ~* /vendor/phpunit/ {
            deny all;
            return 403;
}
location ~* (\.php|\.sql|\.bak|\.conf|\.ini|\.sh|\.exe)$ {
			deny all;
			return 403;
}
location ~* \.(htaccess|htpasswd)$ {
			deny all;
			return 403;
}
location ~* /phpunit/ {
            deny all;
            return 403;
}
```
> location /
> limit_req zone=req_limit burst=20 nodelay - настраивает ограничение запросов. **Можно изменить, но может работать нестабильно.**
```sh
limit_req zone=req_limit burst=20 nodelay;
```
> Обязательно чтобы было указано в конфиге **/etc/nginx/nginx.conf** это значение.
```sh
limit_req_zone $binary_remote_addr zone=req_limit:10m rate=10r/s;
```
> proxy_pass и proxy_set_header - перенаправлять запросы. **Оставить как есть.**
> Если прокси сервер установлен не рядом с FileTransfer, то указать ip адрес (пример, 192.168.3.23).
```sh
proxy_pass http://localhost:1337;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Upgrade $http_upgrade;
```
> proxy_buffering - разрешить буферизировать запросы или нет. **Можно поэкспериментировать.**
```sh
proxy_buffering on;
```
> proxy_buffer_size - эта директива задает размер буфера. **Можно поэкспериментировать.**
```sh
proxy_buffer_size 128k;
```
> proxy_buffers - эта директива контролирует количество (первый аргумент) и размер (второй аргумент) буферов. **Можно поэкспериментировать.**
```sh
proxy_buffers 4 256k;
```
> proxy_busy_buffers_size - это директива в Nginx, которая устанавливает максимальное количество занятых буферов. **Можно поэкспериментировать.**
```sh
proxy_busy_buffers_size 256k;
```
> proxy_request_buffering - это директива в Nginx, которая разрешает или запрещает буферизацию тела клиентского запроса. **Можно поэкспериментировать.**
> **Если off, то может очень сильно ограничить скорость, но зато гарантировано файлы будут загружены напрямую в FileTransfer.**
> **Если on, то Nginx сначало загрузит, а потом передаст на FileTransfer, в редких случаях бывали ошибки со стороны загрузки этим способом (не отображалось табличка с информацией о файле).**
```sh
proxy_request_buffering off;
```
> proxy_read_timeout и proxy_send_timeout - это параметры тайм-аута (чтения/записи). **Можно поэкспериментировать.**
```sh
proxy_read_timeout 300;
proxy_send_timeout 300;
```
> tcp_nodelay - директива, которая разрешает или запрещает использование параметра TCP_NODELAY. **Можно поэкспериментировать.**
```sh
tcp_nodelay on;
```
> proxy_set_header Connection "upgrade" - нужно для обновления соединения до WebSocket. **Оставить как есть.**
```sh
proxy_set_header Connection "upgrade";
```