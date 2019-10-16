/// <reference types="Cypress" />

const options = require('../fixtures/options')

let visitOptions = {}
if('httpUser' in options && options.httpUser != '') visitOptions.auth = {
	username: options.httpUser,
	password: options.httpPassword
}

options.testUrls.forEach((testUrl) => {
	describe('SEO and Meta Tags on ' + testUrl, () => {
		before(() => {
			cy.visit(testUrl, visitOptions);
		});

		it('X-UA-Compatible tag', () => {
			cy.get('meta[http-equiv="X-UA-Compatible"][content="IE=edge"]').should('exist').should('have.length', 1);
		});

		it('Viewport tag', () => {
			cy.get('meta[name="viewport"]').should('exist').should('have.length', 1);
		});

		it('Canonical URL tag', () => {
			cy.get('link[rel="canonical"]').should('exist').should('have.length', 1);
		});

		it('Title tag', () => {
			cy.get('title').should('exist').should('have.length', 1);
		});

		it('Meta description', () => {
			cy.get('meta[name="description"]').should('have.length', 1);
		});

		it('Favicon', () => {
			cy.get('link[rel="shortcut icon"]').should('have.length', 1);
		});

	});
});
