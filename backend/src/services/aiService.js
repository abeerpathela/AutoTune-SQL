const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const optimizeSQL = async (originalQuery, explainPlan) => {
  const prompt = `You are an expert PostgreSQL DBA. Analyze the following PostgreSQL query and its EXPLAIN plan. Rewrite the query for maximum performance while maintaining the same results.

Original Query:
${originalQuery}

EXPLAIN Plan (JSON):
${JSON.stringify(explainPlan, null, 2)}

Return a JSON object with exactly two keys:
- "optimizedQuery": The rewritten, optimized SQL query
- "explanation": A detailed explanation of the optimizations you made, focusing on PostgreSQL-specific improvements

Do not include any markdown or extra text - return only valid JSON.`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    model: 'llama3-70b-8192',
    response_format: { type: 'json_object' },
    temperature: 0.3
  });

  const response = JSON.parse(chatCompletion.choices[0].message.content);
  return response;
};

module.exports = {
  optimizeSQL
};
