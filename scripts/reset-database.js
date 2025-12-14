const { sequelize } = require('../src/config/database');
require('dotenv').config();

async function resetDatabase() {
  console.log('Resetting database...');
  
  try {
    await sequelize.drop();
    console.log('Success All tables dropped');

    await sequelize.sync({ force: true });
    console.log('Success New tables created');
    
    console.log('\n Database reset completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error Database reset failed:', error.message);
    process.exit(1);
  }
}

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Warning This will DELETE ALL DATA. Type "YES" to confirm: ', (answer) => {
  if (answer === 'YES') {
    resetDatabase();
  } else {
    console.log('Reset cancelled.');
    process.exit(0);
  }
  readline.close();
});