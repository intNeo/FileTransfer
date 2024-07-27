const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // Импорт функции для генерации UUID
const https = require('https'); // Импорт модуля https
const http = require('http'); // Для автоматического редиректа с HTTP на HTTPS

const app = express();
const port = process.env.PORT || 1337;

// Чтение SSL сертификатов
//Возможно и сертификаты от Let’s Encrypt
//Тестировал на самоподписанном сертификате
const privateKey = fs.readFileSync('ssl/cert.key', 'utf8');
const certificate = fs.readFileSync('ssl/cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

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
});

process.on('unhandledRejection', (reason, promise) => {
  // Логирование промисов, которые были отклонены без обработки
  console.error('Необработанный промис:', promise, 'Причина:', reason);
  logStream.write(`Необработанный промис: ${promise} Причина: ${reason}\n`);
});

// Middleware для логирования
app.use((req, res, next) => {
  const clientAddress = req.headers['x-real-ip'] || req.connection.remoteAddress; // Для nginx добавлено поддержка хедера
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
    try {
      const downloadLink = `/download/${file.filename}`;
      
      // Сохраняем оригинальное имя в файле
      const fileInfo = {
        originalname: file.originalname
      };
      fs.writeFileSync(`${file.path}.info`, JSON.stringify(fileInfo));
      
      const uploadDate = new Date().toLocaleString();
      const responseFileInfo = {
        filename: file.filename,
        uploadDate: uploadDate,
        downloadLink: downloadLink
      };

      // Выводим имя загружаемого файла в консоль сервера
      const infileconsole = `Имя файла: ${file.originalname} UUID: ${file.filename}`;
      const infilelog = `Имя файла: ${file.originalname} UUID: ${file.filename}\n`;
      console.log(infileconsole);
      logStream.write(infilelog);

      // Отправляем информацию о файле на клиентскую сторону
      res.json(responseFileInfo);
    } catch (err) {
      console.error('Ошибка при сохранении файла:', err);
      logStream.write(`Ошибка при сохранении файла: ${err}\n`);
      res.status(500).send('Ошибка при обработке файла.');
    }
  }
});

// Скачивание файла по ссылке
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'files', filename);
  const infoPath = path.join(__dirname, 'files', `${filename}.info`);

  // Проверяем, существует ли файл
  if (!fs.existsSync(filePath) || !fs.existsSync(infoPath)) {
    return res.status(404).send('Файл не найден.');
  }

  const fileInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));

  // Устанавливаем заголовки ответа для скачивания файла
  res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalname}"`);
  res.setHeader('Content-Length', fs.statSync(filePath).size);

  // Создаем поток для чтения файла и отправляем его клиенту
  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);

  readStream.on('error', (err) => {
    console.error('Ошибка при чтении файла для отправки:', err);
    logStream.write(`Ошибка при чтении файла для отправки: ${err}\n`);
    res.status(500).send('Ошибка при отправке файла.');
  });
});

// Создаем HTTPS сервер
const httpsServer = https.createServer(credentials, app);

// Слушаем порт
httpsServer.listen(port, () => {
  const nameproject = `FileTransfer v.0.5.2`;
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
