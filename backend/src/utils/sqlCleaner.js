const DANGEROUS_KEYWORDS = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE', 'GRANT', 'REVOKE'];
const ALLOWED_START_KEYWORDS = ['SELECT', 'WITH', 'EXPLAIN'];

/**
 * Strips comments and blank lines for validation only.
 * The original SQL should still be used for database execution.
 */
function cleanSqlForValidation(sql) {
  if (!sql || typeof sql !== 'string') return '';

  let cleaned = sql;

  // Remove multi-line comments /* ... */
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, ' ');

  // Remove single-line comments -- ...
  cleaned = cleaned.replace(/--[^\n\r]*/g, ' ');

  // Trim each line, drop blanks, collapse leading/trailing whitespace
  cleaned = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .trim();

  return cleaned;
}

function getLeadingKeyword(cleanedSql) {
  const match = cleanedSql.match(/^([A-Za-z]+)/);
  return match ? match[1].toUpperCase() : '';
}

function isReadOnlyQuery(cleanedSql) {
  const keyword = getLeadingKeyword(cleanedSql);
  return ALLOWED_START_KEYWORDS.includes(keyword);
}

function findDangerousKeyword(cleanedSql) {
  const upper = cleanedSql.toUpperCase();
  for (const keyword of DANGEROUS_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(upper)) {
      return keyword;
    }
  }
  return null;
}

module.exports = {
  cleanSqlForValidation,
  getLeadingKeyword,
  isReadOnlyQuery,
  findDangerousKeyword,
  DANGEROUS_KEYWORDS,
  ALLOWED_START_KEYWORDS,
};
