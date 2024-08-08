require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors'); // CORSを追加
const app = express();
const port = process.env.PORT || 3020; // ポート番号を3000に設定

app.use(cors()); // CORSを有効化

// 'public' フォルダーを静的ファイル用に設定
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.post('/handle-form-filter', (req, res) => {
  console.log('Received POST request');
  console.log('Request body:', req.body);
  const { input_difficulty, input_prefecture } = req.body;
  console.log(`Difficulty: ${input_difficulty}`);
  console.log(`Prefecture: ${input_prefecture}`);
  res.status(200).json({ message: 'Form data received' });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
