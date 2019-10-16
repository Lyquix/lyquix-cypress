/// <reference types="Cypress" />

const options = require('../fixtures/options');

let visitOptions = {};
if('httpUser' in options && options.httpUser != '') visitOptions.auth = {
	username: options.httpUser,
	password: options.httpPassword
};

options.testUrls.forEach((testUrl) => {
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

