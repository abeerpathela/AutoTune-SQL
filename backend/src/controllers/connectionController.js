const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { testConnection, getSchemaMetadata } = require('../services/dbConnector');

const createConnection = async (req, res, next) => {
  try {
    const { name, host, port, database, username, password } = req.body;

    if (!name || !host || !database || !username) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      });
    }

    const connection = await prisma.dbConnection.create({
      data: {
        name,
        host,
        port: port || 5432,
        database,
        username,
        password
      }
    });

    res.status(201).json({
      status: 'success',
      data: connection
    });
  } catch (error) {
    next(error);
  }
};

const getConnections = async (req, res, next) => {
  try {
    const connections = await prisma.dbConnection.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      status: 'success',
      data: connections
    });
  } catch (error) {
    next(error);
  }
};

const deleteConnection = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.dbConnection.delete({
      where: { id }
    });

    res.status(200).json({
      status: 'success',
      message: 'Connection deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const testDbConnection = async (req, res, next) => {
  try {
    const { host, port, database, username, password } = req.body;

    const result = await testConnection({
      host,
      port: port || 5432,
      database,
      username,
      password
    });

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getSchema = async (req, res, next) => {
  try {
    const { id } = req.params;
    const connection = await prisma.dbConnection.findUnique({
      where: { id }
    });

    if (!connection) {
      return res.status(404).json({
        status: 'error',
        message: 'Connection not found'
      });
    }

    const result = await getSchemaMetadata(connection);
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createConnection,
  getConnections,
  deleteConnection,
  testDbConnection,
  getSchema
};
