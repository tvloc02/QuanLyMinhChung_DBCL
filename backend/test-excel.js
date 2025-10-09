// backend/test-excel.js
const XLSX = require('xlsx');

const testFile = 'backend/uploads/temp/1759979315656-984137850.xlsx';

try {
    console.log('Reading file...');
    const workbook = XLSX.readFile(testFile);
    console.log('Sheets:', workbook.SheetNames);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    console.log('Total rows:', data.length);
    console.log('Headers:', Object.keys(data[0]));
    console.log('\nFirst 3 rows:');
    data.slice(0, 3).forEach((row, i) => {
        console.log(`Row ${i + 2}:`, row);
    });
} catch (error) {
    console.error('Error:', error.message);
}