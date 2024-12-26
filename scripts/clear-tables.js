const { sequelize } = require('../src/models');

async function clearTables() {
  try {
    const queryInterface = sequelize.getQueryInterface();

    const tables = await queryInterface.showAllTables();

    for (const table of tables) {
      console.log(`Dropping table if exists: ${table}`);
      await queryInterface.dropTable(table, { cascade: true });
    }

    console.log('All tables dropped successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing tables:', error);
    process.exit(1);
  }
}

clearTables();
