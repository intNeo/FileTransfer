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

// Middleware для логирования
app.use((req, res, next) => {
  const clientAddress = req.connection.remoteAddress;
  const clientPort = req.connection.remotePort;
  const currentTime = new Date().toLocaleString();

  console.log(`${currentTime} ${clientAddress}:${clientPort} ${req.method} ${req.url}`);
  
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
  console.log(`FileTransfer v.0.1`);
  console.log(`Powered by intNeo and Open AI ChatGPT 3.5`);
  console.log(`Большое спасибо за favicon Vectors Tank - Flaticon`);
  console.log(`Сервер запущен на порту ${port}`);  
});