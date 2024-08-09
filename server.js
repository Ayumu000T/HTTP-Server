
/**
 * 林道のソートしたマップを表示するに必要なkmlファイルを、
 * 一時的にサーバーに保存してGoogle Maps APIが読み込めるようにURLを生成
 */

// .envファイルを読み込んで環境変数を設定
import 'dotenv/config'; //.envの設定

//必要モジュール
import express from 'express'; // Webサーバーを構築のためのフレームワーク
import path from 'path'; //  パス操作のためのモジュール
import fs from 'fs'; // ファイルシステム操作のためのモジュール
import { fileURLToPath } from 'url'; // 現在のモジュールのURLをファイルパスに変換するためのヘルパー
import cors from 'cors'; // CORS設定を行うミドルウェア
import multer from 'multer'; // ファイルアップロードを処理するためのミドルウェア
import fetch from 'node-fetch'; // HTTPリクエストを行うためのモジュール

//追加
import { v4 as uuidv4 } from 'uuid'; // UUID生成モジュール

// ディレクトリパスの設定
// ESモジュール形式じゃなければ、そのまま__filenameとかが使えるらしい
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Expressサーバーの設定
const app = express();
const port = process.env.PORT || 3020;


//ミドルウェアの設定
// CORSを有効化
app.use(cors());
// JSONリクエストボディを解析するためのミドルウェア
app.use(express.json());

// 'uploads' ディレクトリを静的ファイルとして提供
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 'public' フォルダーを静的ファイル用に設定、ブラウザ表示用のHTMLファイルなど読み込み（現状必要ない）
// app.use(express.static(path.join(__dirname, 'public')));


//ファイルアップロード処理、受け取ったファイルを一時保存して処理
const storage = multer.memoryStorage(); // メモリストレージを使用
const upload = multer({ storage: storage });


// POSTリクエストの処理
app.post('/filtered-data', upload.single('kmlFile'), async (req, res) => {
  console.log('Received POST request');
  console.log('Received file:', req.file ? req.file.originalname : 'No file received');

  if (req.file) {
    // ユニークなファイル名を生成
    const timestamp = Date.now();
    const uniqueId = uuidv4();
    const fileName = `filteredData_${timestamp}_${uniqueId}.kml`;
    const savePath = path.join(__dirname, 'uploads', fileName);

    // ファイルを保存するディレクトリが存在しない場合は作成
    if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
      fs.mkdirSync(path.join(__dirname, 'uploads'));
    }


    // ファイルを保存
    fs.writeFile(savePath, req.file.buffer, (err) => {
      if (err) {
        console.error('Error saving the file:', err);
        return res.status(500).json({ message: 'Error saving the file' });
      }
      console.log('File saved successfully');


      // NgrokのURLを取得するためのfetchを使用
      const ngrokPort = process.env.NGROK_PORT || 4040;
      fetch(`http://localhost:${ngrokPort}/api/tunnels`)
        .then(response => response.json())
        .then(data => {
          const ngrokUrl = data.tunnels[0].public_url;
          const fileUrl = `${ngrokUrl}/uploads/${fileName}`;
          res.status(200).json({ message: 'KML file received and saved', fileUrl: fileUrl });
        })
        .catch(error => {
          console.error('Error fetching ngrok tunnels:', error);
          res.status(500).json({ message: 'Error fetching ngrok tunnels' });
        });
    });
  } else {
    res.status(400).json({ message: 'No file received' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});