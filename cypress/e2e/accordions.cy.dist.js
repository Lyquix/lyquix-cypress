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
				if(Cypress.$('.accordion-group').length) {
					cy.get('.accordion-group').each(function(accordionGroupElem, accordionGroupIndex, accordionGroupList) {
						if(Cypress.$(accordionGroupList).is(':visible')) {
							// Open and then close each accordion
							cy.wrap(accordionGroupElem).children('.accordion').each(function(clickElem, clickIndex) {
								// Open a closed accordion
								cy.wrap(clickElem).should('have.class', 'closed');
								//cy.wrap(clickElem).children('.accordion-content').children().should('not.be.visible');
								cy.wrap(clickElem).children('.accordion-header').trigger('click');
								cy.wrap(clickElem).should('have.class', 'open');
								cy.wrap(clickElem).children('.accordion-content').should('be.visible');
								cy.wrap(accordionGroupElem).children('.accordion').each(function(otherElem, otherIndex) {
									if(clickIndex != otherIndex) {
										cy.wrap(otherElem).should('have.class', 'closed');
										//cy.wrap(otherElem).children('.accordion-content').children().should('not.be.visible');
									}
								});
								// Close the accordion
								cy.wrap(clickElem).children('.accordion-header').trigger('click');
								cy.wrap(clickElem).should('have.class', 'closed');
								//cy.wrap(clickElem).children('.accordion-content').children().should('not.be.visible');
								cy.wrap(accordionGroupElem).children('.accordion').each(function(otherElem, otherIndex) {
									if(clickIndex != otherIndex) {
										cy.wrap(otherElem).should('have.class', 'closed');
										//cy.wrap(otherElem).children('.accordion-content').should('not.be.visible');
									}
								});
							});
							// Open one accordion then jump to the next
							cy.wrap(accordionGroupElem).children('.accordion').each(function(clickElem, clickIndex) {
								// Open a closed accordion
								cy.wrap(clickElem).should('have.class', 'closed');
								//cy.wrap(clickElem).children('.accordion-content').should('not.be.visible');
								cy.wrap(clickElem).children('.accordion-header').trigger('click');
								cy.wrap(clickElem).should('have.class', 'open');
								cy.wrap(clickElem).children('.accordion-content').should('be.visible');
								cy.wrap(accordionGroupElem).children('.accordion').each(function(otherElem, otherIndex) {
									if(clickIndex != otherIndex) {
										cy.wrap(otherElem).should('have.class', 'closed');
										//cy.wrap(otherElem).children('.accordion-content').should('not.be.visible');
									}
								});
							});
							// Close the last open accordion
							cy.get('.accordion.open .accordion-header').trigger('click');
						}
						else cy.expect(true).to.be.true;
					});
				}
				else cy.expect(true).to.be.true;
			});
		});
	});
});
