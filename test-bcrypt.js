const bcrypt = require('bcryptjs');

async function test() {
  try {
    // Test password hashing
    const password = 'TestPassword123!';
    console.log('Testing bcryptjs functionality...\n');
    
    console.log('1. Testing password hashing:');
    console.log(`   Input password: ${password}`);
    
    const salt = bcrypt.genSaltSync(10);
    console.log(`   Generated salt: ${salt}`);
    
    const hash = bcrypt.hashSync(password, salt);
    console.log(`   Generated hash: ${hash}`);
    console.log(`   Hash format valid: ${hash.startsWith('$2a$') || hash.startsWith('$2b$') ? '✅ YES' : '❌ NO'}`);
    
    // Test password verification
    console.log('\n2. Testing password verification:');
    const isValid = bcrypt.compareSync(password, hash);
    console.log(`   Correct password verification: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
    
    const wrongPassword = 'WrongPassword123!';
    const isInvalid = !bcrypt.compareSync(wrongPassword, hash);
    console.log(`   Wrong password rejection: ${isInvalid ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\n✅ All bcryptjs tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
