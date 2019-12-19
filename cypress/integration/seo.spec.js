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
			cy.get('meta[name="description"]').should('exist').should('have.length', 1);
		});

		it('OpenGraph', () => {
			cy.get('meta[property="og:title"]').should('exist').should('have.length', 1);
			cy.get('meta[property="og:description"]').should('exist').should('have.length', 1);
			cy.get('meta[property="og:image"]').should('exist');
		});

		it('Favicons', () => {
			[
				'link[rel="shortcut icon"][type="image/vnd.microsoft.icon"]',
				'link[rel="apple-touch-icon"][sizes="57x57"]',
				'link[rel="apple-touch-icon"][sizes="60x60"]',
				'link[rel="apple-touch-icon"][sizes="72x72"]',
				'link[rel="apple-touch-icon"][sizes="76x76"]',
				'link[rel="apple-touch-icon"][sizes="114x114"]',
				'link[rel="apple-touch-icon"][sizes="120x120"]',
				'link[rel="apple-touch-icon"][sizes="144x144"]',
				'link[rel="apple-touch-icon"][sizes="152x152"]',
				'link[rel="apple-touch-icon"][sizes="180x180"]',
				'link[rel="icon"][type="image/png"][sizes="192x192"]',
				'link[rel="icon"][type="image/png"][sizes="32x32"]',
				'link[rel="icon"][type="image/png"][sizes="96x96"]',
				'link[rel="icon"][type="image/png"][sizes="16x16"]',
			].forEach(function(sel) {
				cy.get(sel).should('have.length', 1);
			});
		});

	});
});
