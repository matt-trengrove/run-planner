const fs = require('fs');
const authorize = require('./utils/authorize');
const createPlan = require('./utils/createPlan');

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), createPlan);
});