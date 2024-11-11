# FileTransfer
Simple file sharing on NodeJS from intNeo using OpenAI ChatGPT 4o

## How to use:
- You need to download the NodeJS package https://nodejs.org/en/download
- You need to either issue a self-signed certificate or use the Let's Encrypt service.
> Example of issuing a self-signed certificate:
```sh
openssl ecparam -name secp384r1 -genkey -noout -out cert.key
openssl req -x509 -new -key ecc_private_key.pem -out cert.pem -days 720 -sha512
```
> An example of issuing a certificate from Let's Encrypt (certbot) (Be sure to rename it to "cert.pem" and "cert.key"):
```sh
sudo apt-get install certbot
sudo certbot certonly --standalone -d yourdomain.com
```
- Write the following command in the terminal: node Main.js
- Done!

**Can be used and uploaded to hosting!**