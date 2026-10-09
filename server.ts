import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// AI Kunkunshi Generator Endpoint
app.post('/api/gemini/generate-kunkunshi', async (req, res) => {
  try {
    const { songTitle, userPrompt, tuning } = req.body;

    if (!songTitle) {
      return res.status(400).json({ error: '曲名（songTitle）を入力してください。' });
    }

    const promptText = `
曲名: "${songTitle}"
追加リクエスト: "${userPrompt || '標準的な工工四譜面を作成してください。'}"
指定調子: "${tuning || 'Honchoushi'}"

沖縄三線の工工四（クンクンシー）譜面データを正確なJSONフォーマットで生成してください。
使用できる主な工工四音符:
男弦: 合, 乙, 老, 下老
中弦: 四, 上, 工, 五, 六
女弦: 七, 八, 九, 屮, 巾
休符/伸ばし: ◯
技法: 打, 踏, 🈁

1マス（cell）に1音、1列（column）に12マスを基準として、歌持ち（前奏）や一番の歌詞・音符を構成してください。
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction: 'あなたは沖縄三線と工工四（クンクンシー）の伝統音楽に精通したエキスパートです。指定された楽曲の正確な工工四譜面データをJSONとして出力してください。',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            composer: { type: Type.STRING },
            tuning: { type: Type.STRING, description: 'Honchoushi, Niagari, or Sanagari' },
            pitchKey: { type: Type.STRING },
            tempoBpm: { type: Type.INTEGER },
            cellsPerColumn: { type: Type.INTEGER },
            notes: { type: Type.STRING },
            columns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  sectionTitle: { type: Type.STRING },
                  columnLyric: { type: Type.STRING },
                  cells: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        note: { type: Type.STRING },
                        technique: { type: Type.STRING },
                        lyric: { type: Type.STRING },
                      },
                      required: ['id', 'note'],
                    },
                  },
                },
                required: ['id', 'cells'],
              },
            },
          },
          required: ['title', 'tuning', 'tempoBpm', 'cellsPerColumn', 'columns'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const generatedScore = JSON.parse(jsonText);

    // Assign IDs and timestamps if missing
    generatedScore.id = `ai-${Date.now()}`;
    generatedScore.createdAt = new Date().toISOString().split('T')[0];
    generatedScore.updatedAt = new Date().toISOString().split('T')[0];

    res.json({ success: true, score: generatedScore });
  } catch (error: any) {
    console.error('Error generating kunkunshi:', error);
    res.status(500).json({ error: error?.message || '工工四生成中にエラーが発生しました。' });
  }
});

// AI Transpose / Adapt Endpoint
app.post('/api/gemini/transpose', async (req, res) => {
  try {
    const { score, targetTuning } = req.body;
    if (!score || !targetTuning) {
      return res.status(400).json({ error: 'Score data and targetTuning are required.' });
    }

    const promptText = `
以下の工工四（クンクンシー）データを、現在の「${score.tuning}」から目標の調子「${targetTuning}」へ移調（ポジション変換）したデータを作成してください。
現在のスコア:
${JSON.stringify(score)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction: '工工四の調子変換（本調子・二揚げ・三揚げ）の音符ポジション変換を行う専門アシスタントです。',
        responseMimeType: 'application/json',
      },
    });

    const transposed = JSON.parse(response.text || '{}');
    res.json({ success: true, score: transposed });
  } catch (error: any) {
    console.error('Error transposing kunkunshi:', error);
    res.status(500).json({ error: error?.message || '移調処理に失敗しました。' });
  }
});

// Dev server or production static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
