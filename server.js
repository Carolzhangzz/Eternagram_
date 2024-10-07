require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();

app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in the environment variables');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

const generateText = async (prompt) => {
  console.log('Prompt:', prompt);

  try {
    const completion = await openai.completions.create({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 1024,
      n: 1,
      stop: '\n',
      temperature: 0.7,
    });

    console.log('Completion:', completion);
    return completion.choices[0].text.trim();
  } catch (error) {
    console.error('Error in generateText:', error);
    throw error;
  }
};

app.get('/', (req, res) => {
  console.log("Server is running!");
  res.send('Server is running!');
});

app.post('/api/generate-text', async (req, res) => {
  const { prompt } = req.body;

  try {
    const text = await generateText(prompt);
    res.send(text);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating text');
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});