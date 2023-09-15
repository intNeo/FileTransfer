const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // Импорт функции для генерации UUID

const app = express();
const port = process.env.PORT || 1337;

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
    const downloadLink = `/download/${file.filename}`;
    const uploadDate = new Date().toLocaleString();

    // Отправляем JSON с информацией о файле
    const fileInfo = {
      filename: file.filename,
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

  // Устанавливаем заголовки ответа для скачивания файла
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Создаем поток для чтения файла и отправляем его клиенту
  const fileStream = fs.createReadStream(filePath);

  fileStream.on('error', (err) => {
    res.status(404).send('Файл не найден.');
  });

  fileStream.pipe(res);
});


// Слушаем порт
app.listen(port, () => {
  const nameproject = `FileTransfer v.0.2`;
  const powered = `Powered by intNeo and Open AI ChatGPT 3.5`;
  const description = `Большое спасибо за favicon Vectors Tank - Flaticon`;
  const runport = `Сервер запущен на порту ${port}`;
  const currentTime = new Date().toLocaleString();
  console.log(nameproject + '\n' + powered + '\n' + description + `\n` + runport);
  logStream.write(`==========[${currentTime}=[Сервер запущен]==========` + `\n`);
});