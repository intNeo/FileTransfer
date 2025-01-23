const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // Импорт функции для генерации UUID
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 1337;
app.set('trust proxy', 1); // Доверяет первому прокси в цепочке

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
app.use(express.static('public'));

// Создаем поток вывода для записи в файл log.txt
const logStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });

// Middleware для логирования
app.use((req, res, next) => {
  const clientAddress = req.headers['x-real-ip'] || req.connection.remoteAddress;
  const clientPort = req.connection.remotePort;
  const currentTime = new Date().toLocaleString();
  const logMessage = `[${currentTime}] ${clientAddress}:${clientPort} ${req.method} ${req.url}`;

  console.log(logMessage);
  logStream.write(logMessage + '\n');
  next();
});

// Ограничение частоты запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // Максимум 100 запросов с одного IP
  message: 'Слишком много запросов с этого IP. Попробуйте позже.',
});
app.use(limiter);

// Защита от неизвестных путей
app.use((req, res, next) => {
  if (req.path.startsWith('/download') || req.path === '/upload' || req.path === '/') {
    next();
  } else {
    res.status(403).send('Доступ запрещен.');
  }
});

// Дополнительная защита
// Ограничение размера запросов
app.use(express.json({ limit: '10kb' })); // Ограничение на JSON тела
app.use(express.urlencoded({ limit: '10kb', extended: true })); // Ограничение на URL-кодированные тела

// Отклонение запросов с подозрительными параметрами
app.use((req, res, next) => {
  const forbiddenPatterns = [
    /eval/i,
    /phpunit/i,
    /auto_prepend_file/i,
    /allow_url_include/i,
    /\.php$/i
  ];
  const query = req.url + JSON.stringify(req.body);

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(query)) {
      logStream.write(`Запрос заблокирован: ${req.url}\n`);
      return res.status(400).send('Запрос заблокирован.');
    }
  }
  next();
});

// Ограничение методов
app.use((req, res, next) => {
  const allowedMethods = ['GET', 'POST'];
  if (!allowedMethods.includes(req.method)) {
    logStream.write(`Метод заблокирован: ${req.method} ${req.url}\n`);
    return res.status(405).send('Метод не разрешен.');
  }
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
        originalname: file.originalname,
      };
      fs.writeFileSync(`${file.path}.info`, JSON.stringify(fileInfo));
      const uploadDate = new Date().toLocaleString();
      const responseFileInfo = {
        filename: file.filename,
        uploadDate: uploadDate,
        downloadLink: downloadLink,
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

// Обработка необработанных ошибок
process.on('uncaughtException', (err) => {
  console.error('Необработанная ошибка:', err);
  logStream.write(`Необработанная ошибка: ${err}\n`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанное отклонение:', reason);
  logStream.write(`Необработанное отклонение: ${reason}\n`);
});

// Слушаем порт
app.listen(port, () => {
  const nameproject = `FileTransfer v.0.6`;
  const powered = `Powered by intNeo and Open AI ChatGPT 4`;
  const description = `Большое спасибо за favicon Vectors Tank - Flaticon`;
  const runport = `Сервер запущен на порту ${port}`;
  const currentTime = new Date().toLocaleString();
  console.log(nameproject + '\n' + powered + '\n' + description + `\n` + runport);
  logStream.write(`==========[${currentTime}=[Сервер запущен]==========` + `\n`);
});
