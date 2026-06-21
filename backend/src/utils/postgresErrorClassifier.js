function extractPostgresCode(err) {
  if (!err) return null;

  // node-pg driver errors
  if (err.code && /^[0-9A-Z]{5}$/.test(err.code) && !err.code.startsWith('P')) {
    return err.code;
  }

  if (err.meta?.code) {
    return err.meta.code;
  }

  const prismaMatch = err.message?.match(/Code: `([^`]+)`/);
  if (prismaMatch) {
    return prismaMatch[1];
  }

  return null;
}

function extractRelationName(message = '') {
  const relationMatch = message.match(/relation "([^"]+)" does not exist/i);
  if (relationMatch) return relationMatch[1];

  const tableMatch = message.match(/table "([^"]+)" does not exist/i);
  if (tableMatch) return tableMatch[1];

  return null;
}

function extractColumnName(message = '') {
  const match = message.match(/column "([^"]+)" does not exist/i);
  return match ? match[1] : null;
}

function classifyPostgresError(err) {
  const code = extractPostgresCode(err);
  const rawMessage = err?.message || 'Unknown database error';

  switch (code) {
    case '42P01': {
      const table = extractRelationName(rawMessage);
      return {
        errorCategory: 'Schema',
        code: '42P01',
        message: table
          ? `The table '${table}' does not exist in the current database.`
          : 'A referenced table does not exist in the current database.',
        hint: 'Check if the table name is spelled correctly or if you are connected to the correct database.',
        isSyntaxValid: false,
      };
    }
    case '42703': {
      const column = extractColumnName(rawMessage);
      return {
        errorCategory: 'Schema',
        code: '42703',
        message: column
          ? `The column '${column}' does not exist in the current database.`
          : 'A referenced column does not exist in the current database.',
        hint: 'Verify the column name exists and is available in the tables referenced by your query.',
        isSyntaxValid: false,
      };
    }
    case '42601':
      return {
        errorCategory: 'Syntax',
        code: '42601',
        message: 'Invalid SQL structure.',
        hint: 'Review your SQL syntax — check for missing commas, unmatched parentheses, or invalid keywords.',
        isSyntaxValid: false,
      };
    case '28P01':
      return {
        errorCategory: 'Connection',
        code: '28P01',
        message: 'Database authentication failed. Invalid username or password.',
        hint: 'Verify your database credentials in the connection settings.',
        isSyntaxValid: false,
      };
    case '28000':
      return {
        errorCategory: 'Connection',
        code: '28000',
        message: 'Database permission error. The user is not authorized to run this query.',
        hint: 'Ensure the database user has sufficient privileges for the requested operation.',
        isSyntaxValid: false,
      };
    default: {
      if (/relation ".*" does not exist|table ".*" does not exist/i.test(rawMessage)) {
        const table = extractRelationName(rawMessage);
        return {
          errorCategory: 'Schema',
          code: code || '42P01',
          message: table
            ? `The table '${table}' does not exist in the current database.`
            : 'A referenced table does not exist in the current database.',
          hint: 'Check if the table name is spelled correctly or if you are connected to the correct database.',
          isSyntaxValid: false,
        };
      }

      if (/column ".*" does not exist/i.test(rawMessage)) {
        const column = extractColumnName(rawMessage);
        return {
          errorCategory: 'Schema',
          code: code || '42703',
          message: column
            ? `The column '${column}' does not exist in the current database.`
            : 'A referenced column does not exist in the current database.',
          hint: 'Verify the column name exists and is available in the tables referenced by your query.',
          isSyntaxValid: false,
        };
      }

      return {
        errorCategory: 'Syntax',
        code: code || 'UNKNOWN',
        message: rawMessage.replace(/^Invalid `prisma\.\$queryRawUnsafe\(\)` invocation:\s*/i, '').trim(),
        hint: 'Review your query syntax and try again.',
        isSyntaxValid: false,
      };
    }
  }
}

module.exports = {
  classifyPostgresError,
  extractPostgresCode,
};
