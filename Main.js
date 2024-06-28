const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // Импорт функции для генерации UUID
const https = require('https'); // Импорт модуля https
const http = require('http'); // Для автоматического редиректа с HTTP на HTTPS
const crypto = require('crypto'); // Импорт модуля crypto

const app = express();
const port = process.env.PORT || 1337;

// Чтение SSL сертификатов
//Возможно и сертификаты от Let’s Encrypt
//Тестировал на самоподписанном сертификате
const privateKey = fs.readFileSync('ssl/cert.key', 'utf8');
const certificate = fs.readFileSync('ssl/cert.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate };

// Генерация ключа и вектора инициализации (IV)
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32); // 32 байта для aes-256
const iv = crypto.randomBytes(16); // 16 байт для IV

// Установка хранилища для загруженных файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './files';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Генерируем случайное имя файла с использованием UUID
    const randomFilename = uuidv4();
    const fileExtension = path.extname(file.originalname);

    // Склеиваем UUID и расширение файла
    const newFilename = `${randomFilename}${fileExtension}`;
    cb(null, newFilename);
  },
});

const upload = multer({ storage });

app.use(express.static('public')); // Создайте публичную папку для доступа к файлам

// Создаем поток вывода для записи в файл log.txt
const logStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });

process.on('uncaughtException', (error) => {
  // Логирование ошибки в консоль и в файл
  console.error('Необработанная ошибка:', error);
  logStream.write(`Необработанная ошибка: ${error}\n`);

  // Завершение процесса
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  // Логирование промисов, которые были отклонены без обработки
  console.error('Необработанный промис:', promise, 'Причина:', reason);
  logStream.write(`Необработанный промис: ${promise} Причина: ${reason}\n`);
});

// Middleware для логирования
app.use((req, res, next) => {
  const clientAddress = req.connection.remoteAddress;
  const clientPort = req.connection.remotePort;
  const currentTime = new Date().toLocaleString();
  const logMessage = `[${currentTime}] ${clientAddress}:${clientPort} ${req.method} ${req.url}`;

  console.log(logMessage); // Выводим в консоль
  logStream.write(logMessage + '\n'); // Записываем в файл
  
  next();
});

// Отправка HTML-страницы для загрузки файла
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка загрузки файла
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).send('Ошибка загрузки файла.');
  } else {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const input = fs.createReadStream(file.path);
    const output = fs.createWriteStream(file.path + '.enc');

    input.pipe(cipher).pipe(output);

    output.on('finish', () => {
      fs.unlinkSync(file.path); // Удаляем оригинальный файл после шифрования
      const downloadLink = `/download/${file.filename}.enc`;
      const uploadDate = new Date().toLocaleString();

      // Отправляем JSON с информацией о файле
      const fileInfo = {
        filename: `${file.filename}.enc`,
        uploadDate: uploadDate,
        downloadLink: downloadLink
      };

      // Выводим имя загружаемого файла в консоль сервера
      const infileconsole = `Имя файла: ` + file.originalname + ` UUID: ` + file.filename;
      const infilelog = `Имя файла: ` + file.originalname + ` UUID: ` + file.filename + `\n`;
      console.log(infileconsole);
      logStream.write(infilelog);

      // Отправляем информацию о файле на клиентскую сторону
      res.json(fileInfo);
    });
  }
});

// Скачивание файла по ссылке
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'files', filename);

  // Проверяем, существует ли файл
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Файл не найден.');
  }
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  
  // Устанавливаем заголовки ответа для скачивания файла
  res.setHeader('Content-Disposition', `attachment; filename="${filename.replace('.enc', '')}"`);

  // Создаем поток для чтения файла и отправляем его клиенту
  const input = fs.createReadStream(filePath);
  
  input.pipe(decipher).pipe(res);

  input.on('error', (err) => {
    res.status(404).send('Файл не найден.');
  });
});

// Создаем HTTPS сервер
const httpsServer = https.createServer(credentials, app);

// Слушаем порт
httpsServer.listen(port, () => {
  const nameproject = `FileTransfer v.0.5`;
  const powered = `Powered by intNeo and Open AI ChatGPT 4`;
  const description = `Большое спасибо за favicon Vectors Tank - Flaticon`;
  const runport = `Сервер запущен на порту ${port}`;
  const currentTime = new Date().toLocaleString();
  console.log(nameproject + '\n' + powered + '\n' + description + `\n` + runport);
  logStream.write(`==========[${currentTime}=[Сервер запущен]==========` + `\n`);
});

// HTTP сервер для редиректа на HTTPS
http.createServer((req, res) => {
  res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
  res.end();
}).listen(80);
