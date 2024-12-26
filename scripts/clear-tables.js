const { sequelize } = require('../src/models');

async function clearTables() {
  const queryInterface = sequelize.getQueryInterface();
  try {
    console.log('Clearing all tables...');
    await queryInterface.dropAllTables();
    console.log('All tables cleared.');
  } catch (error) {
    console.error('Error clearing tables:', error);
  } finally {
    await sequelize.close();
  }
}

clearTables();
