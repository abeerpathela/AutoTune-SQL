const Groq = require('groq-sdk');

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Validate Groq configuration on startup
const validateGroqConfig = () => {
  const hasApiKey = !!process.env.GROQ_API_KEY;
  const hasModel = !!process.env.GROQ_MODEL; // Optional, but recommended

  if (hasApiKey) {
    console.log('✅ Groq configuration loaded');
    console.log(`   - Model: ${MODEL}`);
  } else {
    console.log('❌ Invalid Groq configuration');
    console.log('   - GROQ_API_KEY environment variable is missing');
  }
};

validateGroqConfig();

const optimizeSQL = async (originalQuery, explainPlan, schemaMetadata = null) => {
  let schemaContext = '';
  if (schemaMetadata) {
    schemaContext = `\nDatabase Schema Metadata:\n${JSON.stringify(schemaMetadata, null, 2)}\n`;
  }

  const prompt = `You are an expert PostgreSQL DBA. Analyze the following PostgreSQL query and its EXPLAIN plan. Rewrite the query for maximum performance while maintaining the same results.
${schemaContext}
Original Query:
${originalQuery}

EXPLAIN Plan (JSON):
${JSON.stringify(explainPlan, null, 2)}

Return a JSON object with exactly two keys:
- "optimizedQuery": The rewritten, optimized SQL query
- "explanation": A detailed explanation of the optimizations you made, focusing on PostgreSQL-specific improvements

Do not include any markdown or extra text - return only valid JSON.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const response = JSON.parse(chatCompletion.choices[0].message.content);
    return response;
  } catch (error) {
    // Log exact Groq error for debugging
    console.error('❌ Groq API Error:', JSON.stringify(error, null, 2));

    // Handle model decommissioned error
    if (error.code === 'model_decommissioned') {
      throw new Error('The configured AI model is no longer available. Please update the Groq model configuration.');
    }

    // Re-throw other errors
    throw error;
  }
};

module.exports = {
  optimizeSQL
};
