const fs = require('fs');
const path = require('path');

const needSchemaFiles = [
  'apps/api/src/shared/validation/need.schema.ts',
  'apps/web/src/shared/validation/need.schema.ts'
];

const productSchemaFiles = [
  'apps/api/src/shared/validation/product.schema.ts',
  'apps/web/src/shared/validation/product.schema.ts'
];

function preprocessNumber(str) {
  return str.replace(/z\.number\(\)(.*?)\.optional\(\)\.nullable\(\)/g, 'z.preprocess((val) => Number.isNaN(val) || val === "" ? undefined : Number(val), z.number()$1.optional().nullable())');
}

function preprocessDate(str) {
  return str.replace(/z\.string\(\)\.datetime\(\)\.optional\(\)\.nullable\(\)/g, 'z.preprocess((val) => val === "" ? undefined : val, z.string().datetime().optional().nullable())');
}

for (const file of needSchemaFiles) {
  const filePath = path.resolve('../../', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = preprocessNumber(content);
    content = preprocessDate(content);
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}

for (const file of productSchemaFiles) {
  const filePath = path.resolve('../../', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = preprocessNumber(content);
    content = preprocessDate(content);
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
