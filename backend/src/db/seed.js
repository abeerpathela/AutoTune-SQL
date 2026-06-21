const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const chapters = [
  {
    title: 'Introduction to Databases',
    content: `# Introduction to Databases

Welcome to AutoTune-SQL Academy! This chapter covers the fundamentals of databases.

## What is a Database?

A database is an organized collection of data, stored and accessed electronically.

## Types of Databases

- **Relational Databases** (SQL-based): PostgreSQL, MySQL, SQL Server
- **NoSQL Databases**: MongoDB, Cassandra, Redis
- **NewSQL Databases**: CockroachDB, Google Spanner

## SQL Overview

SQL (Structured Query Language) is used to communicate with databases.

## Practice Exercise

\`\`\`sql
SELECT 1;
\`\`\``,
    order: 1
  },
  {
    title: 'SQL Basics',
    content: `# SQL Basics

Let's start with the fundamentals of SQL.

## The SELECT Statement

The SELECT statement retrieves data from a database.

\`\`\`sql
SELECT * FROM users;
\`\`\``,
    order: 2
  },
  {
    title: 'Filtering Data',
    content: `# Filtering Data

Use the WHERE clause to filter data.

\`\`\`sql
SELECT * FROM users WHERE age > 18;
\`\`\``,
    order: 3
  },
  {
    title: 'Sorting Data',
    content: `# Sorting Data

Use ORDER BY to sort your results.

\`\`\`sql
SELECT * FROM users ORDER BY name ASC;
\`\`\``,
    order: 4
  },
  {
    title: 'Aggregations',
    content: `# Aggregations

Aggregate functions like COUNT, SUM, AVG, MIN, MAX.

\`\`\`sql
SELECT COUNT(*) FROM users;
\`\`\``,
    order: 5
  },
  {
    title: 'GROUP BY',
    content: `# GROUP BY

Group rows that have the same values.

\`\`\`sql
SELECT country, COUNT(*) FROM users GROUP BY country;
\`\`\``,
    order: 6
  },
  {
    title: 'HAVING',
    content: `# HAVING

Filter groups with HAVING.

\`\`\`sql
SELECT country, COUNT(*) 
FROM users 
GROUP BY country 
HAVING COUNT(*) > 100;
\`\`\``,
    order: 7
  },
  {
    title: 'Joins',
    content: `# Joins

Combine rows from two or more tables.

\`\`\`sql
SELECT users.name, orders.amount
FROM users
JOIN orders ON users.id = orders.user_id;
\`\`\``,
    order: 8
  },
  {
    title: 'Subqueries',
    content: `# Subqueries

A query within another query.

\`\`\`sql
SELECT name FROM users WHERE id IN (SELECT user_id FROM orders WHERE amount > 100);
\`\`\``,
    order: 9
  },
  {
    title: 'CTEs',
    content: `# Common Table Expressions (CTEs)

Temporary result sets you can reference.

\`\`\`sql
WITH active_users AS (
  SELECT * FROM users WHERE last_login > NOW() - INTERVAL '7 days'
)
SELECT COUNT(*) FROM active_users;
\`\`\``,
    order: 10
  },
  {
    title: 'Window Functions',
    content: `# Window Functions

Perform calculations across a set of table rows.

\`\`\`sql
SELECT name, salary, AVG(salary) OVER () as avg_salary FROM users;
\`\`\``,
    order: 11
  },
  {
    title: 'Indexes',
    content: `# Indexes

Improve query performance.

\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
\`\`\``,
    order: 12
  },
  {
    title: 'Views',
    content: `# Views

Virtual tables based on the result-set of a query.

\`\`\`sql
CREATE VIEW active_users AS SELECT * FROM users WHERE is_active = true;
\`\`\``,
    order: 13
  },
  {
    title: 'Transactions',
    content: `# Transactions

Ensure data integrity.

\`\`\`sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
\`\`\``,
    order: 14
  },
  {
    title: 'Query Optimization',
    content: `# Query Optimization

Analyze and improve your queries.

\`\`\`sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
\`\`\``,
    order: 15
  },
  {
    title: 'Execution Plans',
    content: `# Execution Plans

Understand how PostgreSQL executes your query.

Use EXPLAIN to see the plan.`,
    order: 16
  },
  {
    title: 'Cost-Based Optimization',
    content: `# Cost-Based Optimization

How the planner chooses the best execution plan.`,
    order: 17
  },
  {
    title: 'Partitioning',
    content: `# Partitioning

Split large tables into smaller, more manageable pieces.`,
    order: 18
  },
  {
    title: 'Materialized Views',
    content: `# Materialized Views

Store the result of a query physically.

\`\`\`sql
CREATE MATERIALIZED VIEW user_stats AS SELECT date, COUNT(*) FROM users GROUP BY date;
\`\`\``,
    order: 19
  },
  {
    title: 'Database Scaling',
    content: `# Database Scaling

Strategies for handling growth.`,
    order: 20
  },
  {
    title: 'EXPLAIN',
    content: `# PostgreSQL EXPLAIN

Learn to read EXPLAIN output.

\`\`\`sql
EXPLAIN SELECT * FROM users WHERE id = 1;
\`\`\``,
    order: 21
  },
  {
    title: 'EXPLAIN ANALYZE',
    content: `# EXPLAIN ANALYZE

Execute the query and show actual runtime statistics.

\`\`\`sql
EXPLAIN ANALYZE SELECT * FROM users WHERE id = 1;
\`\`\``,
    order: 22
  },
  {
    title: 'Index Strategies',
    content: `# Index Strategies

Choosing the right index.`,
    order: 23
  },
  {
    title: 'VACUUM',
    content: `# VACUUM

Reclaim storage and maintain table health.`,
    order: 24
  },
  {
    title: 'ANALYZE',
    content: `# ANALYZE

Update statistics for the query planner.

\`\`\`sql
ANALYZE users;
\`\`\``,
    order: 25
  },
  {
    title: 'Performance Tuning',
    content: `# Performance Tuning

Optimize your database performance.`,
    order: 26
  }
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Create or update course
  const course = await prisma.course.upsert({
    where: { id: 'demo-course' },
    update: {},
    create: {
      id: 'demo-course',
      title: 'SQL Optimization Fundamentals',
      description: 'Complete guide to SQL and PostgreSQL optimization'
    }
  });

  // Delete existing chapters
  await prisma.chapter.deleteMany({
    where: { courseId: course.id }
  });

  // Create new chapters
  for (const chapter of chapters) {
    await prisma.chapter.create({
      data: {
        ...chapter,
        courseId: course.id
      }
    });
  }

  console.log(`✅ Created ${chapters.length} chapters for course: ${course.title}`);
  console.log('✅ Database seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
