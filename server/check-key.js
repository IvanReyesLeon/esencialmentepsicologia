const credentials = require('./credentials.json');

console.log('=== Checking Private Key ===\n');
console.log('PK exists:', !!credentials.private_key);
console.log('PK type:', typeof credentials.private_key);
console.log('PK length:', credentials.private_key?.length);
console.log('First 60 chars:', credentials.private_key?.substring(0, 60));
console.log('Last 60 chars:', credentials.private_key?.substring(credentials.private_key.length - 60));
console.log('Contains literal \\n:', credentials.private_key?.includes('\\n'));
console.log('Contains actual newline:', credentials.private_key?.includes('\n'));
