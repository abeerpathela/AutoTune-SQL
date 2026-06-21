const { PrismaClient } = require('@prisma/client');
const { runSelectQuery } = require('./dbConnector');
const { classifyPostgresError } = require('../utils/postgresErrorClassifier');
const { markLabPassed } = require('./progressService');

const prisma = new PrismaClient();

function getAcademyDbConfig() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured');

  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432', 10),
    database: parsed.pathname.replace(/^\//, '').split('?')[0],
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  };
}

function serializeValue(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value.constructor?.name === 'Decimal') return value.toString();
  return value;
}

function serializeRows(rows) {
  return rows
    .map((row) => {
      const normalized = {};
      for (const key of Object.keys(row).sort()) {
        normalized[key] = serializeValue(row[key]);
      }
      return JSON.stringify(normalized);
    })
    .sort();
}

function resultsMatch(userRows, targetRows) {
  const a = serializeRows(userRows);
  const b = serializeRows(targetRows);
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
}

async function executeLabQuery(sql) {
  const config = getAcademyDbConfig();
  return runSelectQuery(config, sql);
}

async function validatePracticeQuery(userId, chapterId, userSql) {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) throw new Error('Chapter not found');
  if (!chapter.targetSql) throw new Error('This chapter has no lab target configured');

  const progress = await prisma.userProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
  });

  if (progress && !progress.isUnlocked && chapter.globalOrder !== 1) {
    const err = new Error('Chapter locked');
    err.code = 'CHAPTER_LOCKED';
    throw err;
  }

  let userResult;
  try {
    userResult = await executeLabQuery(userSql);
  } catch (error) {
    const classified = classifyPostgresError(error);
    return {
      passed: false,
      error: classified.message,
      errorCategory: classified.errorCategory,
      rows: [],
      fields: [],
      rowCount: 0,
    };
  }

  let targetResult;
  try {
    targetResult = await executeLabQuery(chapter.targetSql);
  } catch (error) {
    throw new Error('Lab target query failed on academy database');
  }

  const passed = resultsMatch(userResult.rows, targetResult.rows);

  let completion = null;
  if (passed) {
    const result = await markLabPassed(userId, chapterId);
    completion = result.completion;
  }

  return {
    passed,
    rows: userResult.rows,
    fields: userResult.fields,
    rowCount: userResult.rowCount,
    targetRowCount: targetResult.rowCount,
    completion,
  };
}

module.exports = {
  validatePracticeQuery,
  executeLabQuery,
  resultsMatch,
  getAcademyDbConfig,
};
