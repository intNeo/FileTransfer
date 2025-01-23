# FileTransfer
Простой файлообменник на NodeJS от intNeo с использованием OpenAI ChatGPT 4o.
## Установка:
- Вам нужно скачать пакет NodeJS с официального сайта https://nodejs.org/en/download
- (Для Linux) Перейдите в директорию /opt и пропишите в консоле git clone.
```sh
cd /opt
git clone https://github.com/intNeo/FileTransfer.git
```
## Настройка обратного прокси на Nginx
> Вам нужно установить пакет nginx для Linux:
```sh
sudo apt install nginx
```
> ВАЖНО! Обязательно добавить строчку кода в конфиг nginx.conf:
```sh
sudo nano /etc/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=req_limit:10m rate=10r/s;
```
> Далее переместите файл filetransfer в директорию sites-available и далее сделайте символическую ссылку в sites-enabled:
> Затем откройте его и поменяйте server_name с example.com на свой домен:
```sh
sudo mv filetransfer /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/filetransfer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```
## Настройка защищённого соединения
- Понадобится сертификат от Let's Encrypt, ZeroSSL и т.п.
> Вот пример как выпустить сертификат Let's Encrypt с помощью certbot:
```sh
sudo apt-get install certbot
sudo certbot certonly --standalone -d yourdomain.com
```
- Либо для тестового стенда достаточно и самоподписанного сертификата.
> Вот пример как сгенерировать самоподписанный сертификат:
```sh
openssl ecparam -name secp384r1 -genkey -noout -out cert.key
```
```sh
openssl req -x509 -new -key cert.key -out cert.pem -days 720 -sha512
```
## Запуск:
- Два варианта (универсальные для Linux и Windows):
> Перейти в директорию и написать в консоле следующее: node Main.js.
- Еще один для Linux через systemd (строго в должен быть в /opt):
> Переместите файл-демон в директорию /etc/systemd/system:
```sh
sudo mv filetransfer.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable filetransfer.service --now
```
**Готово! Можно использовать. (p.s. по умолчанию максимальный размер загружаемого файла составляет 10 ГБ, вы можете его изменить в конфиге nginx, но не рекомендую, т.к. может работать нестабильно).**