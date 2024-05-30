const { defineConfig } = require('cypress')
const { lighthouse, pa11y, prepareAudit } = require('cypress-audit');

module.exports = defineConfig({
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter.json',
  },
  e2e: {
    setupNodeEvents(on, config) {
      on("before:browser:launch", (browser = {}, launchOptions) => {
        prepareAudit(launchOptions);
      });

      on("task", {
        lighthouse: lighthouse((lighthouseReport) => {
          console.log(lighthouseReport); // Output the report for debugging
          return lighthouseReport;
        }),
        pa11y: pa11y(),
      });
    },
    testIsolation: false,
  },
})
