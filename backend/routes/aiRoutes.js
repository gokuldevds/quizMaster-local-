const express = require('express');
const router = express.Router();

// Protect route - require authenticated user
const { protect } = require('../middleware/authMiddleware');

router.post('/generate-quiz', protect, async (req, res) => {
  const { topic, difficulty, questionCount } = req.body;
  if (!topic || !questionCount) {
    return res.status(400).json({ message: 'topic and questionCount required' });
  }

  try {
    // Dynamically import the SDK to work in CommonJS environment
    const ga = await import('@google/generative-ai');
    const { GoogleGenerativeAI, SchemaType } = ga;

    const apiKey = process.env.GA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Generative AI key not configured on server' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const schema = {
      description: 'List of quiz questions',
      type: SchemaType.OBJECT,
      properties: {
        response_code: { type: SchemaType.NUMBER, nullable: false },
        results: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              type: { type: SchemaType.STRING, nullable: false },
              difficulty: { type: SchemaType.STRING, nullable: false },
              category: { type: SchemaType.STRING, nullable: false },
              question: { type: SchemaType.STRING, nullable: false },
              correct_answer: { type: SchemaType.STRING, nullable: false },
              incorrect_answers: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                nullable: false,
              },
            },
            required: [
              'type',
              'difficulty',
              'category',
              'question',
              'correct_answer',
              'incorrect_answers',
            ],
          },
          nullable: false,
        },
      },
      required: ['response_code', 'results'],
    };

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const prompt = `Create ${questionCount} quiz questions about ${topic}\nDifficulty: ${difficulty}\nType: Multiple Choice`;

    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
    });

    // Parse and return the structured JSON produced by the model
    const parsed = JSON.parse(result.response.text());
    res.json(parsed);
  } catch (err) {
    console.error('AI generation error', err);
    res.status(500).json({ message: 'Failed to generate questions', error: err.message });
  }
});

module.exports = router;
