const { Client } = require('pg');
const {
  cleanSqlForValidation,
  isReadOnlyQuery,
  findDangerousKeyword,
} = require('../utils/sqlCleaner');
const TIMEOUT = 10000; // 10 seconds

function createClient(config) {
  return new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password
  });
}

async function testConnection(config) {
  const client = createClient(config);
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Connection timeout')), TIMEOUT)
  );

  try {
    await Promise.race([client.connect(), timeout]);
    await Promise.race([client.query('SELECT 1'), timeout]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    await client.end().catch(() => {});
  }
}

async function getSchemaMetadata(config) {
  const client = createClient(config);
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Connection timeout')), TIMEOUT)
  );

  try {
    await Promise.race([client.connect(), timeout]);

    const tablesResult = await Promise.race([
      client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `),
      timeout
    ]);

    const tables = tablesResult.rows.map(r => r.table_name);
    const schema = {};

    for (const table of tables) {
      const columnsResult = await Promise.race([
        client.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [table]),
        timeout
      ]);
      schema[table] = columnsResult.rows.map(r => ({
        name: r.column_name,
        type: r.data_type
      }));
    }

    return { success: true, tables, schema };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    await client.end().catch(() => {});
  }
}

async function runExplain(config, sql) {
  const originalQuery = typeof sql === 'string' ? sql.trim() : '';
  const cleanedSql = cleanSqlForValidation(originalQuery);

  const dangerousKeyword = findDangerousKeyword(cleanedSql);
  if (dangerousKeyword) {
    throw new Error('Dangerous SQL operations are not allowed.');
  }

  if (!isReadOnlyQuery(cleanedSql)) {
    throw new Error('Only SELECT, WITH, or EXPLAIN queries are allowed.');
  }

  const client = createClient(config);
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Query timeout')), TIMEOUT)
  );

  try {
    await Promise.race([client.connect(), timeout]);

    // First run EXPLAIN (without ANALYZE) for syntax check
    const explainResult = await Promise.race([
      client.query(`EXPLAIN (FORMAT JSON) ${originalQuery}`),
      timeout,
    ]);
    const explainPlan = explainResult.rows[0]['QUERY PLAN'][0];

    // Then run EXPLAIN ANALYZE for performance
    const fullExplainResult = await Promise.race([
      client.query(`EXPLAIN (FORMAT JSON, ANALYZE) ${originalQuery}`),
      timeout,
    ]);

    return {
      success: true,
      explainPlan,
      fullExplainPlan: fullExplainResult.rows[0]['QUERY PLAN'][0]
    };
  } catch (error) {
    throw error;
  } finally {
    await client.end().catch(() => {});
  }
}

module.exports = {
  testConnection,
  getSchemaMetadata,
  runExplain
};
