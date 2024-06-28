# FileTransfer
Simple file sharing on NodeJS from intNeo using OpenAI ChatGPT 3.5

## How to use:
- You need to download the NodeJS package https://nodejs.org/en/download
- You need to either issue a self-signed certificate or use the Let's Encrypt service.
> Example of issuing a self-signed certificate:
```sh
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /your/path/cert.key -out /your/path/cert.pem
```
> An example of issuing a certificate from Let's Encrypt (certbot) (Be sure to rename it to "cert.pem" and "cert.key"):
```sh
sudo apt-get install certbot
sudo certbot certonly --standalone -d yourdomain.com
```
- Write the following command in the terminal: node Main.js
- Done!

**Can be used and uploaded to hosting!**