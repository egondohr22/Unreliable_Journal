const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY not set. AI modifications will be disabled.');
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

/**
 * @param {string} title - Note title (will NOT be modified)
 * @param {string} content - Note content
 * @param {string} changeRate - 'low', 'medium', or 'high'
 * @returns {Promise<{title: string, content: string}>} - Original title and modified content
 */
async function modifyNoteContent(title, content, changeRate = 'medium') {
  if (!ai) {
    console.log('Gemini API not configured, skipping modification');
    return { title, content };
  }

  try {
    const changeIntensity = {
      low: 'very subtly and minimally (1-2 small changes)',
      medium: 'subtly (3-5 small changes)',
      high: 'noticeably but not drastically (5-8 changes)',
    };

    const prompt = `You are modifying a personal journal entry to make it slightly unreliable over time. The user's preference is "${changeRate}" change rate.

IMPORTANT RULES:
1. Modify ONLY the content text ${changeIntensity[changeRate]}
2. Keep the overall meaning and context similar
3. Make changes that could plausibly be memory errors or slight misremembering
4. You can:
   - Change small details (colors, times, exact numbers)
   - Swap similar words or phrases
   - Slightly alter emotions or reactions
   - Add or remove minor details
5. DO NOT completely change the story or make it unrecognizable
6. Return ONLY valid JSON with a "content" field containing the modified text
7. Preserve the general structure and formatting

Original Content: ${content}

Return the modified content as JSON with a single "content" field:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const modified = JSON.parse(jsonMatch[0]);

      if (modified.content) {
        console.log(`Note content modified with ${changeRate} change rate`);
        return {
          title: title,
          content: modified.content,
        };
      }
    }

    throw new Error('Invalid response format from Gemini');
  } catch (error) {
    console.error('Error modifying note with Gemini:', error);
    return { title, content };
  }
}

module.exports = {
  modifyNoteContent,
};
