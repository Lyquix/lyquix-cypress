/// <reference types="Cypress" />

const options = require('../fixtures/options');

let linksChecked = [];
let visitOptions = {};
if('httpUser' in options && options.httpUser != '') visitOptions.auth = {
	username: options.httpUser,
	password: options.httpPassword
};
let requestOptions = {};
if('httpUser' in options && options.httpUser != '') requestOptions.auth = {
	username: options.httpUser,
	password: options.httpPassword
};

options.testUrls.forEach((testUrl) => {
	describe('Broken Links on ' + testUrl, () => {
		before(() => {
			cy.visit(testUrl, visitOptions);
		});

		it('Check links on ' + testUrl, () => {
			cy.get('a').each((link) => {
				let href = link.attr('href');
				if(typeof href != 'undefined' && href != '') {
					let allow = true;
					if(
						href.indexOf('tel:') == 0 ||
						href.indexOf('sms:') == 0 ||
						href.indexOf('mailto:') == 0 ||
						href.indexOf('ftp:') == 0 ||
						href.indexOf('file:') == 0
					) allow = false;
					if(href.indexOf('http') == 0 && href.indexOf(options.baseUrl) != 0) allow = false;
					if(allow && !linksChecked.includes(href)) {
						linksChecked.push(href);
						requestOptions.url = href;
						cy.request(requestOptions);
					}
				}
			});
		});
	});
});
