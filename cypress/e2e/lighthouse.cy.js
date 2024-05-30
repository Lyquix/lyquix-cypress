/// <reference types="Cypress" />

const options = require('../fixtures/options');

let visitOptions = {};
if ('httpUser' in options && options.httpUser !== '') {
    visitOptions.auth = {
        username: options.httpUser,
        password: options.httpPassword,
    };
}

const testUrls = Cypress.env('url') ? [Cypress.env('url')] : options.testUrls;
const thresholds = {
    performance: 80,
    accessibility: 80,
    'best-practices': 80,
    seo: 80,
    pwa: 80,
};

testUrls.forEach((testUrl) => {
    describe('Lighthouse Audit on ' + testUrl, () => {
        before(() => {
            cy.visit(testUrl, visitOptions);
        });

        // Handle uncaught exceptions
        Cypress.on('uncaught:exception', (err, runnable) => {
            // Prevent the test from failing
            return false;
        });

        it('should pass the Lighthouse audits', () => {
            cy.lighthouse(thresholds).then((report) => {
                console.log(report); // Log the Lighthouse report for debugging
            });
            cy.pa11y();
        });
    });
});
