/// <reference types="Cypress" />
// Prevent js error "resizeobserver loop limit" from breaking cypress tests
Cypress.on('uncaught:exception', (err) => {
    if (/^ResizeObserver loop limit exceeded/.test(err.message)) {
        return false
    }
});

const options = require('../fixtures/options')

const visitOptions = {}
if ('httpUser' in options && options.httpUser != '') visitOptions.auth = {
    username: options.httpUser,
    password: options.httpPassword
}

let testUrls = Cypress.env('url') ? [Cypress.env('url')] : options.testUrls;
testUrls.forEach((testUrl) => {
    describe('General Errors on ' + testUrl, () => {
        before(() => {
            cy.visit(testUrl, visitOptions);
        });

        // Handle uncaught exceptions
        Cypress.on('uncaught:exception', (err, runnable) => {
            // Prevent the test from failing
            return false;
        });

        it('Checks the server response header for a status code different than 200, 301, and 302', function () {
            let testId = this.test.id;
            cy.request({
                url: testUrl,
                failOnStatusCode: false
            }).then((response) => {
                if (![200, 301, 302].includes(response.status)) {
                    window['extra'][testId].push({
                        title: 'Unexpected status code',
                        value: response.status
                    });
                    expect(response.status).not.to.include([200, 301, 302]);
                }
            });
        });

        it('Checks for any PHP error and warning displayed in the HTML', function () {
            let testId = this.test.id;
            cy.document().then((doc) => {
                let bodyText = doc.body.innerText;
                let phpErrors = [
                    'Fatal error',
                    'Parse error',
                    'Warning',
                    'Notice'
                ];
                phpErrors.forEach((error) => {
                    if (bodyText.includes(error)) {
                        window['extra'][testId].push({
                            title: 'PHP error found',
                            value: error
                        });
                        expect(bodyText).not.to.include(error);
                    }
                });
            });
        });

        it('Checks if the page is missing the <header>, <main>, or <footer> tags', function () {
            let testId = this.test.id;
            cy.document().then((doc) => {
                let tags = ['header', 'main', 'footer'];
                tags.forEach((tag) => {
                    if (!doc.querySelector(tag)) {
                        window['extra'][testId].push({
                            title: 'Missing tag',
                            value: `<${tag}> tag not found`
                        });
                        cy.get(tag).should('exist');
                    }
                });
            });
        });

        it('Checks if any asset could not be loaded', function () {
            let testId = this.test.id;
            cy.get('img, link[rel="stylesheet"], script').each(($el) => {
                let tag = $el.prop('tagName').toLowerCase();
                let url = $el.prop(tag === 'link' ? 'href' : 'src');

                if (url) {
                    cy.request({
                        url: url,
                        failOnStatusCode: false
                    }).then((response) => {
                        if (response.status !== 200) {
                            window['extra'][testId].push({
                                title: 'Asset failed to load',
                                value: `${url} with status code ${response.status}`
                            });
                            expect(response.status).to.include([200]);
                        }
                    });
                }
            });
        });

        it('Detects any JavaScript error raised on the page', function () {
            const testId = this.test.id;
            cy.on('window:alert', (msg) => {
                window['extra'][testId].push({
                    title: 'JavaScript error alert',
                    value: `Alert message: ${msg}`
                });
                expect(msg).to.not.exist;
            });

            cy.on('uncaught:exception', (err) => {
                const errorMessage = err.message.match(/> (.*)/);
                const cleanErrorMessage = errorMessage ? errorMessage[1] : err.message;
                const errorDetails = {
                    title: err.name,
                    message: cleanErrorMessage,
                    stack: err.stack
                        ? err.stack.split('\n').filter(line => line.trim().startsWith('at')).join('\n')
                        : 'N/A'
                };

                window['extra'][testId].push({
                    title: 'Uncaught JavaScript error',
                    value: `Title: ${errorDetails.title}\nMessage: ${errorDetails.message}\nStack:\n${errorDetails.stack}`
                });
                expect(err.name).to.not.exist;
                return false;
            });
            cy.visit(testUrl);
        });
    });
});
