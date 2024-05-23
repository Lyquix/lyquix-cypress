/// <reference types="Cypress" />
// Prevent js error "resizeobserver loop limit" from breaking cypress tests
Cypress.on('uncaught:exception', (err) => {
  if(/^ResizeObserver loop limit exceeded/.test(err.message)) {
    return false
  }
});

const options = require('../../fixtures/options');

let visitOptions = {};
if('httpUser' in options && options.httpUser != '') visitOptions.auth = {
	username: options.httpUser,
	password: options.httpPassword
};

const testUrls = Cypress.env('url') ? [Cypress.env('url')] : options.testUrls;
testUrls.forEach((testUrl) => {
	describe('Accordions on ' + testUrl, function() {
		before(() => {
			cy.visit(testUrl, visitOptions);
		});
		Object.keys(options.screens).forEach((size) => {
			it(size, function() {
				cy.viewport(options.screens[size][0], options.screens[size][1]);
				cy.wait(250);
				if(Cypress.$('.tab-nav').length && Cypress.$('.tab-content').length) {
					cy.get('.tab-nav').each(function(tabNavElem, tabNavIndex, tabNavList) {
						if(Cypress.$(tabNavList).is(':visible')) {
							// Click on each tab
							cy.wrap(tabNavList).children('.tab').each(function(tabElem, tabIndex, tabList) {
								cy.wrap(tabElem).trigger('click');
								cy.wrap(tabList). each(function(otherTab, otherIndex) {
									var tabNumber = Cypress.$(otherTab).attr('data-number');
									if(tabIndex == otherIndex) {
										cy.wrap(otherTab).should('have.class', 'open');
										cy.get('.tab-content .tab-panel[data-number="' + tabNumber + '"]').should('have.class', 'open').should('be.visible');
									}
									else {
										cy.wrap(otherTab).should('have.class', 'closed');
										cy.get('.tab-content .tab-panel[data-number="' + tabNumber + '"]').should('have.class', 'closed').should('not.be.visible');
									}
								})
							});
						}
						else cy.expect(true).to.be.true;
					});
				}
			});
		});
	});
});
