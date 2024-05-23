/// <reference types="Cypress" />
// Prevent js error "resizeobserver loop limit" from breaking cypress tests
Cypress.on('uncaught:exception', (err) => {
  if(/^ResizeObserver loop limit exceeded/.test(err.message)) {
    return false
  }
});

const options = require('../fixtures/options')

let visitOptions = {}
if('httpUser' in options && options.httpUser != '') visitOptions.auth = {
	username: options.httpUser,
	password: options.httpPassword
}

const testUrls = Cypress.env('url') ? [Cypress.env('url')] : options.testUrls;
testUrls.forEach((testUrl) => {
	describe('Snapshots for ' + testUrl, () => {
		it('', () => {
			cy.visit(testUrl, visitOptions);
			Object.keys(options.screens).forEach((size) => {
				cy.viewport(options.screens[size][0], options.screens[size][1]);
				cy.wait(500);
				cy.percySnapshot('Snapshot on ' + size + ' at ' + testUrl, { widths: [options.screens[size][0]], minHeight: options.screens[size][1]});
			});
		});
	});
});
