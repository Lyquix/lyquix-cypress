/// <reference types="Cypress" />
// Prevent js error "resizeobserver loop limit" from breaking cypress tests
Cypress.on('uncaught:exception', (err) => {
  if(/^ResizeObserver loop limit exceeded/.test(err.message)) {
    return false
  }
});

const options = require('../fixtures/options')

const visitOptions = {}
if('httpUser' in options && options.httpUser != '') visitOptions.auth = {
	username: options.httpUser,
	password: options.httpPassword
}

let testUrls = Cypress.env('url') ? [Cypress.env('url')] : options.testUrls;
testUrls.forEach((testUrl) => {
	describe('SEO and Meta Tags on ' + testUrl, () => {
		before(() => {
			cy.visit(testUrl, visitOptions);
		});

		// Handle uncaught exceptions
		Cypress.on('uncaught:exception', (err, runnable) => {
			// Log the error to understand why the test is failing
			console.error('Uncaught Exception:', err);
			// Prevent the test from failing
			return false;
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
			cy.get('title').then(($title) => {
				expect($title.text().length).to.be.within(10, 70);
			});
		});

		it('Meta description', () => {
			cy.get('meta[name="description"]').should('exist').should('have.length', 1);
			cy.get('meta[name="description"]').then(($desc) => {
				expect($desc.attr('content').length).to.be.within(50, 320);
			});
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
				cy.get(sel, { timeout: 10000 }).should('have.length', 1);
			});
		});

		it('Checks for http:// links', function () {
			let testId = this.test.id;
			cy.get('a[href^="http:"]', { timeout: 10000 }).each(($a) => {
				window['extra'][testId].push({
					title: 'Insecure link found',
					value: $a.prop('outerHTML')
				});
			}).should('not.exist');
		});

		it('Missing alt attribute in images', function () {
			let testId = this.test.id;
			cy.get('img', { timeout: 10000 }).each(($img) => {
				if (!$img.attr('alt') || $img.attr('alt').trim() === '') {
					window['extra'][testId].push({
						title: 'Missing alt attribute in image',
						value: $img.prop('outerHTML')
					});
					expect($img).to.have.attr('alt').not.empty;
				}
			});
		});

		it('Missing robots.txt file', () => {
			cy.request({
				url: testUrl + '/robots.txt',
				failOnStatusCode: false
			}).then((response) => {
				expect(response.status).to.eq(200);
			});
		});

		it('Missing XML sitemap in robots.txt', () => {
			cy.request(testUrl + '/robots.txt').then((response) => {
				expect(response.body).to.include('Sitemap:');
			});
		});

		it('Missing XML sitemap file', function () {
			let testId = this.test.id;
			cy.request(testUrl + '/robots.txt').then((response) => {
				let sitemapUrlMatch = response.body.match(/Sitemap:\s*(.*)/);
				if (sitemapUrlMatch) {
					let sitemapUrl = sitemapUrlMatch[1];
					cy.request({
						url: sitemapUrl,
						failOnStatusCode: false
					}).then((response) => {
						if (response.status !== 200) {
							window['extra'][testId].push({
								title: 'Missing XML sitemap file',
								value: `Sitemap URL: ${sitemapUrl}, Status: ${response.status}`
							});
						}
						expect(response.status).to.eq(200);
					});
				}
			});
		});

		it('Unnecessary redirects', function () {
			let testId = this.test.id;
			cy.get('a[href]', { timeout: 10000 }).each(($a) => {
				let href = $a.attr('href');
				if (href.startsWith('http')) {
					cy.request({
						url: href,
						followRedirect: false
					}).then((response) => {
						if (response.status === 301 || response.status === 302) {
							let location = response.redirectedToUrl;
							let unnecessaryRedirect = location.match(/^(http:\/\/|https:\/\/[^/]+\/$)/);
							if (unnecessaryRedirect) {
								window['extra'][testId].push({
									title: 'Unnecessary redirect',
									value: `${href} -> ${location}`
								});
							}
							expect(unnecessaryRedirect).to.be.null;
						}
					});
				}
			});
		});

		it('Redirect chains', function () {
			let testId = this.test.id;
			cy.get('a[href]', { timeout: 10000 }).each(($a) => {
				let href = $a.attr('href');
				if (href.startsWith('http')) {
					cy.request({
						url: href,
						followRedirect: false
					}).then((response) => {
						if (response.status === 301 || response.status === 302) {
							let location = response.redirectedToUrl;
							cy.request({
								url: location,
								followRedirect: false
							}).then((secondResponse) => {
								if (secondResponse.status === 301 || secondResponse.status === 302) {
									let secondLocation = secondResponse.redirectedToUrl;
									cy.request({
										url: secondLocation,
										followRedirect: false
									}).then((thirdResponse) => {
										if (thirdResponse.status === 301 || thirdResponse.status === 302) {
											window['extra'][testId].push({
												title: 'Redirect chain',
												value: `${href} -> ${location} -> ${secondLocation} -> ${thirdResponse.redirectedToUrl}`
											});
										}
										expect(thirdResponse.status).to.not.equal(301);
										expect(thirdResponse.status).to.not.equal(302);
									});
								}
							});
						}
					});
				}
			});
		});

		it('Redirect loops', function () {
			let testId = this.test.id;
			cy.get('a[href]', { timeout: 10000 }).each(($a) => {
				let href = $a.attr('href');
				if (href.startsWith('http')) {
					let redirects = [];
					let maxRedirects = 10;

					let checkRedirect = (url) => {
						return cy.request({
							url: url,
							followRedirect: false
						}).then((response) => {
							if (response.status === 301 || response.status === 302) {
								let location = response.redirectedToUrl;
								if (redirects.includes(location) || redirects.length > maxRedirects) {
									window['extra'][testId].push({
										title: 'Redirect loop detected',
										value: `URL: ${url} -> ${location}`
									});
									throw new Error('Redirect loop detected');
								}
								redirects.push(location);
								return checkRedirect(location);
							}
						});
					};

					checkRedirect(href);
				}
			});
		});

		it('Broken links', function () {
			let testId = this.test.id;
			cy.get('a[href]', { timeout: 10000 }).each(($a) => {
				let href = $a.attr('href');
				if (href.startsWith('http')) {
					cy.request({
						url: href,
						failOnStatusCode: false
					}).then((response) => {
						if (![200, 301, 302].includes(response.status)) {
							window['extra'][testId].push({
								title: 'Broken link',
								value: `${href} responded with status code ${response.status}`
							});
						}
						expect([200, 301, 302]).to.include(response.status);
					});
				}
			});
		});
	});
});
