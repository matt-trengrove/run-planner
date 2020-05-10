const { google } = require('googleapis');
const inquirer = require('inquirer');
const moment = require('moment');
const momentTz = require('moment-timezone');

function addToCalendar(auth, plan, raceDate, planName) {
  const calendar = google.calendar({ version: 'v3', auth });

  const raceDateString = raceDate.format('DD-MM-YYYY');
  const currentDate = raceDate.subtract(plan.length - 1, 'days');

  calendar.calendarList.list((err, res) => {
    if (err) return console.log('The API returned an error: ' + err);

    const calendars = res.data.items.map(cal => ({ name: cal.summary, id: cal.id }));
    const calendarNames = calendars.map(cal => cal.name);

    inquirer
      .prompt([
        {
          type: 'list',
          name: 'calendar',
          message: 'Which calendar would you like to add this plan to?',
          choices: calendarNames,
        },
      ])
      .then(answers => {
        const calendarId = calendars[calendarNames.indexOf(answers.calendar)].id;

        inquirer
          .prompt([{
            type: 'confirm',
            name: 'confirmation',
            message: `Confirm that you would like to create a plan using the ${planName} template for a ${raceDateString} race day: `
          }])
          .then(answers => {
            if (!answers.confirmation)
              return;

            let events = [];

            plan.forEach(day => {
              const date = currentDate.format('YYYY-MM-DD');

              const event = {
                summary: day.title,
                description: day.description,
                start: {
                  date,
                  timeZone: momentTz.tz.guess(),
                },
                end: {
                  date,
                  timeZone: momentTz.tz.guess(),
                }
              };

              if (!day.title.includes('Rest'))
                events.push(event);

              currentDate.add(1, 'day');
            });

            const intervalTime = 100;
            const retryTime = 250;
            const eventCount = events.length;
            let successCount = 0;
            
            const addEvent = (event) => {
              calendar.events.insert({
                auth,
                calendarId,
                resource: event,
              }, (err) => {
                if (!err) {
                  successCount++;
                  console.log(`Successfully created event ${successCount}/${eventCount}`);
                  return;
                }

                setTimeout(() => {
                  addEvent(event);
                }, retryTime);

                console.log('There was an error contacting the Calendar service: ' + err);
              });
            };

            const interval = setInterval(() => {
              if (!events.length) {
                clearInterval(interval);
                return;
              }

              const event = events.pop();
              addEvent(event);
            }, intervalTime);
          })
          .catch(error => {
            console.logerror;
          });
      })
      .catch(error => {
        console.logerror;
      });
  });
}

module.exports = addToCalendar;