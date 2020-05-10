const { google } = require('googleapis');
const inquirer = require('inquirer');
const moment = require('moment');
const addToCalendar = require('./addToCalendar');

/**
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function createPlan(auth) {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'raceDate',
        message:
          'Enter the date of the race in the following format DD-MM-YYYY: ',
      },
      {
        type: 'input',
        name: 'url',
        message: 'Enter the spreadsheet url: ',
      },
    ])
    .then(answers => {
      const raceDate = moment(answers.raceDate, 'DD-MM-YYYY');

      const spreadsheetId = answers.url
        .split('docs.google.com/spreadsheets/d/')[1]
        .split('/')[0];

      readPlan(auth, spreadsheetId, (plan, planName) => addToCalendar(auth, plan, raceDate, planName));
    })
    .catch(error => {
      console.logerror;
    });
}

function readPlan(auth, spreadsheetId, callback) {
  const sheets = google.sheets({ version: 'v4', auth });

  sheets.spreadsheets.get({ spreadsheetId }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);

    const sheetNames = res.data.sheets.map((sheet) => sheet.properties.title);

    inquirer
      .prompt([
        {
          type: 'list',
          name: 'sheet',
          message: 'Which plan would you like to use?',
          choices: sheetNames,
        },
      ])
      .then(answers => {
        const planName = answers.sheet;

        sheets.spreadsheets.values.get({ spreadsheetId, range: `${planName}!A1:H` }, (err, res) => {
          if (err) return console.log('The API returned an error: ' + err);

          const rows = res.data.values;

          if (!rows.length) {
            console.log('No data found.');
            return;
          }
          const plan = [];

          // First row is the header. Then each weeks covers three rows.
          for (let i = 1; i < rows.length; i += 3) {
            const week = rows[i].slice(1).map(title => ({ title }));

            const descriptions = rows[i + 1].slice(1).map(description => ({ description }));

            descriptions.forEach((d, idx) => {
              week[idx].description = d;
            });

            plan.push(...week);
          }

          callback(plan, planName);
        });
      })
      .catch(error => {
        console.logerror;
      });
  }
  );
}

module.exports = createPlan;