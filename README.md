# FileTransfer
Простой файлообменник на NodeJS от intNeo с использованием OpenAI ChatGPT 4o

## Как использовать:
- (Для Linux) Перейдите в директорию /opt и пропишите в консоле git clone;
```sh
cd /opt
git clone https://github.com/intNeo/FileTransfer.git
```
- Вам нужно скачать пакет NodeJS с официального сайта https://nodejs.org/en/download ;
- Вам нужно, либо сгенерировать самоподписанный сертификат, либо воспользоваться сервисом Let’s Encrypt.
> Вот пример как сгенерировать самоподписанный сертификат:
```sh
openssl ecparam -name secp384r1 -genkey -noout -out cert.key
```
```sh
openssl req -x509 -new -key cert.key -out cert.pem -days 720 -sha512
```
> Вот пример как выпустить сертификат Let's Encrypt с помощью certbot (обязательно после выдачи переименуйте их в "cert.pem" и "cert.key"):
```sh
sudo apt-get install certbot
sudo certbot certonly --standalone -d yourdomain.com
```
## Как запускать:

Два варианта (универсальные для Linux и Windows):
> Перейти в директорию и написать в консоле следующее: node Main.js.

Еще один для Linux через systemd:
> Переместите файл-демон в директорию /etc/systemd/system:
```sh
sudo mv filetransfer.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable filetransfer.service --now
```
**Для тестов в локальной сети можно и на этом остановиться, но для публичного доступа переходим к следующему шагу**
## Настройка обратного прокси (обязательно, т.к. приложение еще сырое и может подвергаться атакам) на примере Nginx
> Вам нужно установить пакет nginx для Linux:
```sh
sudo apt install nginx
```
> Далее переместите файл filetransfer в директорию sites-available и далее сделайте символическую ссылку в sites-enabled:
```sh
sudo mv filetransfer /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/filetransfer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```
**Готово! Можно использовать. (p.s. по умолчанию максимальный размер загружаемого файла составляет 10 ГБ, вы можете его изменить в конфиге nginx).**