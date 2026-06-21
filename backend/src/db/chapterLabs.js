/**
 * Unique practice lab per chapter (globalOrder 1–36).
 * correct answer for quizzes is always index 0 in DB; labs validate columns + row counts.
 */

const LABS_BY_GLOBAL_ORDER = {
  1: { practiceQuery: 'SELECT 1 AS academy_ready;', expectedResult: { columns: ['academy_ready'], rowCount: 1 } },
  2: { practiceQuery: "SELECT certificate_id FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1;", expectedResult: { columns: ['certificate_id'], minRows: 0 } },
  3: { practiceQuery: 'SELECT current_database() AS db_name;', expectedResult: { columns: ['db_name'], rowCount: 1 } },
  4: { practiceQuery: 'SELECT version();', expectedResult: { columns: ['version'], rowCount: 1 } },
  5: { practiceQuery: 'SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = \'public\';', expectedResult: { columns: ['table_count'], rowCount: 1 } },
  6: { practiceQuery: 'SELECT 36 AS total_chapters;', expectedResult: { columns: ['total_chapters'], rowCount: 1 } },
  7: { practiceQuery: 'SELECT id, email FROM users LIMIT 5;', expectedResult: { columns: ['id', 'email'], minRows: 1 } },
  8: { practiceQuery: "SELECT * FROM users WHERE email LIKE '%@%';", expectedResult: { columns: ['id', 'email'], minRows: 1 } },
  9: { practiceQuery: 'SELECT name FROM users LIMIT 5;', expectedResult: { columns: ['name'], minRows: 1 } },
  10: { practiceQuery: "SELECT * FROM users WHERE id IN (SELECT id FROM users LIMIT 3);", expectedResult: { columns: ['id', 'email'], minRows: 1 } },
  11: { practiceQuery: 'SELECT DISTINCT email FROM users LIMIT 10;', expectedResult: { columns: ['email'], minRows: 1 } },
  12: { practiceQuery: 'SELECT * FROM users ORDER BY email ASC LIMIT 5;', expectedResult: { columns: ['id', 'email'], minRows: 1 } },
  13: { practiceQuery: 'SELECT u.email, o.id FROM users u INNER JOIN orders o ON u.id = o.user_id LIMIT 5;', expectedResult: { columns: ['email', 'id'], minRows: 0 } },
  14: { practiceQuery: 'SELECT u.email, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id LIMIT 5;', expectedResult: { columns: ['email', 'total'], minRows: 0 } },
  15: { practiceQuery: 'SELECT u.email, o.id FROM users u LEFT JOIN orders o ON u.id = o.user_id LIMIT 5;', expectedResult: { columns: ['email', 'id'], minRows: 1 } },
  16: { practiceQuery: 'SELECT user_id, COUNT(*) AS order_count FROM orders GROUP BY user_id LIMIT 5;', expectedResult: { columns: ['user_id', 'order_count'], minRows: 0 } },
  17: { practiceQuery: 'SELECT u.email, o.id FROM users u JOIN orders o ON u.id = o.user_id WHERE o.id IS NOT NULL LIMIT 3;', expectedResult: { columns: ['email', 'id'], minRows: 0 } },
  18: { practiceQuery: 'SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status;', expectedResult: { columns: ['status', 'cnt'], minRows: 0 } },
  19: { practiceQuery: 'SELECT status, COUNT(*) FROM orders GROUP BY status;', expectedResult: { columns: ['status', 'count'], minRows: 0 } },
  20: { practiceQuery: 'SELECT user_id, SUM(total) AS revenue FROM orders GROUP BY user_id LIMIT 5;', expectedResult: { columns: ['user_id', 'revenue'], minRows: 0 } },
  21: { practiceQuery: 'SELECT category, AVG(price) AS avg_price FROM products GROUP BY category;', expectedResult: { columns: ['category', 'avg_price'], minRows: 0 } },
  22: { practiceQuery: 'SELECT user_id, SUM(total) AS spend FROM orders GROUP BY user_id HAVING SUM(total) > 0 LIMIT 5;', expectedResult: { columns: ['user_id', 'spend'], minRows: 0 } },
  23: { practiceQuery: 'SELECT category, COUNT(*) AS product_count FROM products GROUP BY category;', expectedResult: { columns: ['category', 'product_count'], minRows: 0 } },
  24: { practiceQuery: 'SELECT user_id, COUNT(*) AS orders FROM orders GROUP BY user_id ORDER BY orders DESC LIMIT 5;', expectedResult: { columns: ['user_id', 'orders'], minRows: 0 } },
  25: { practiceQuery: 'SELECT id, email FROM users WHERE email IS NOT NULL LIMIT 10;', expectedResult: { columns: ['id', 'email'], minRows: 1 } },
  26: { practiceQuery: "EXPLAIN SELECT * FROM users WHERE email = 'admin@example.com';", expectedResult: { columns: ['QUERY PLAN'], rowCount: 1 } },
  27: { practiceQuery: 'EXPLAIN SELECT * FROM orders WHERE user_id = 1;', expectedResult: { columns: ['QUERY PLAN'], rowCount: 1 } },
  28: { practiceQuery: 'EXPLAIN ANALYZE SELECT COUNT(*) FROM users;', expectedResult: { columns: ['QUERY PLAN'], rowCount: 1 } },
  29: { practiceQuery: 'SELECT id FROM users WHERE id IN (SELECT user_id FROM orders) LIMIT 5;', expectedResult: { columns: ['id'], minRows: 0 } },
  30: { practiceQuery: 'SELECT * FROM users LIMIT 100;', expectedResult: { columns: ['id', 'email'], minRows: 1 } },
  31: { practiceQuery: 'SELECT COUNT(*) AS query_logs FROM "QueryLog";', expectedResult: { columns: ['query_logs'], rowCount: 1 } },
  32: { practiceQuery: 'SELECT COUNT(*) AS progress_rows FROM "UserProgress";', expectedResult: { columns: ['progress_rows'], rowCount: 1 } },
  33: { practiceQuery: 'SELECT type, COUNT(*) AS chapters FROM "Chapter" GROUP BY type;', expectedResult: { columns: ['type', 'chapters'], minRows: 1 } },
  34: { practiceQuery: "SELECT error_category, COUNT(*) FROM \"QueryLog\" WHERE error_category IS NOT NULL GROUP BY error_category LIMIT 5;", expectedResult: { columns: ['error_category', 'count'], minRows: 0 } },
  35: { practiceQuery: 'SELECT global_order, title FROM "Chapter" ORDER BY global_order LIMIT 5;', expectedResult: { columns: ['global_order', 'title'], rowCount: 5 } },
  36: { practiceQuery: 'SELECT COUNT(*) AS completed FROM "UserProgress" WHERE "isCompleted" = true;', expectedResult: { columns: ['completed'], rowCount: 1 } },
};

function getLabForChapter(globalOrder) {
  const lab = LABS_BY_GLOBAL_ORDER[globalOrder] || {
    practiceQuery: 'SELECT 1 AS ok;',
    expectedResult: { columns: ['ok'], rowCount: 1 },
  };
  return {
    ...lab,
    targetSql: lab.practiceQuery,
  };
}

module.exports = { LABS_BY_GLOBAL_ORDER, getLabForChapter };
