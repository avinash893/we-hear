const fs = require('fs');
const path = require('path');

const target = process.argv[2] || 'sqlite';
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

let content = fs.readFileSync(schemaPath, 'utf8');

if (target === 'postgresql' || target === 'postgres') {
  content = content.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  console.log('✅ Switched Prisma schema datasource to PostgreSQL');
} else {
  content = content.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  console.log('✅ Switched Prisma schema datasource to SQLite');
}

fs.writeFileSync(schemaPath, content, 'utf8');
