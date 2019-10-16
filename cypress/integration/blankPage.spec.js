/// <reference types="Cypress" />

const options = require('../fixtures/options');

let visitOptions = {};
if('httpUser' in options && options.httpUser != '') visitOptions.auth = {
	username: options.httpUser,
	password: options.httpPassword
};

options.testUrls.forEach((testUrl) => {
	describe('Blank Page on ' + testUrl, () => {
		before(() => {
			cy.visit(testUrl, visitOptions);
		});

		it('<html> tag exists and is visible', () => {
			cy.get('html').should('exist').should('be.visible');
		});

		it('<head> tag exists', () => {
			cy.get('head').should('exist');
		});

		it('<body> tag exists and is visible', () => {
			cy.get('body').should('exist').should('be.visible');
		});

	});
});
