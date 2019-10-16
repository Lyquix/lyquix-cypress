/// <reference types="Cypress" />

const options = require('../fixtures/options')

let visitOptions = {}
if('httpUser' in options && options.httpUser != '') visitOptions.auth = {
	username: options.httpUser,
	password: options.httpPassword
}

options.testUrls.forEach((testUrl) => {
	describe('Snapshots for ' + testUrl, () => {
		it('', () => {
			cy.visit(testUrl, visitOptions);
			Object.keys(options.screens).forEach((size) => {
				cy.percySnapshot('Snapshot on ' + size + ' at ' + testUrl, { widths: [options.screens[size][0]], minHeight: options.screens[size][1]});
			});
		});
	});
});
