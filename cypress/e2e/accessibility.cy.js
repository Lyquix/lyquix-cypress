/// <reference types="Cypress" />
// Prevent js error "resizeobserver loop limit" from breaking cypress tests
Cypress.on('uncaught:exception', (err) => {
  if(/^ResizeObserver loop limit exceeded/.test(err.message)) {
    return false
  }
});

const options = require('../fixtures/options');

let visitOptions = {};
if('httpUser' in options && options.httpUser != '') visitOptions.auth = {
	username: options.httpUser,
	password: options.httpPassword
};

// Check if the environment variable is set
const testUrls = Cypress.env('url') ? [Cypress.env('url')] : options.testUrls;
testUrls.forEach((testUrl) => {
	describe('Accesibility on ' + testUrl, () => {
		before(() => {
			cy.visit(testUrl, visitOptions);
			cy.injectAxe();
		});

		options.axeRules.forEach((rulesTag) => {
			it('Run axe rules ' + rulesTag, () => {
				cy.configureAxe();
				cy.checkA11y({
					runOnly: [rulesTag]
				});
			});
		});
	});
})

