# Lyquix Cypress Tests

Base setup to get started with cypress end-to-end website testing.

## Installation

1. Download this repo and extract it within your project, in itw own folder, for example `/tests`

2. Install dependencies with `npm install`

3. In `package.json` update:
 - Under `scripts` update `set PERCY_TOKEN=mytoken` with the token from percy.io for the project
 - Under `percy` update the value of the "Authorization" header. If you are using HTTP Basic Authorization you can use https://www.blitter.se/utils/basic-authentication-header-generator/ to generate a Base64 encoded string of the username and password. If not, remove the "Authorization" key.

3. In `cypress/fixtures/options.json`:
 - Update "baseUrl"
 - Enter the list of URLs to test in "testUrls"
 - If using HTTP Basic Auth, enter the username and password in "httpUser" and "httpPassword"

## Executing Tests

To open Cypress UI:
```
npm run cypress:open
```

To run all tests on headless Cypress
```
npm run cypress:run
```

To generate HTML reports of the all tests
```
npm run cypress:report
```

To take visual snapshot of the project
```
npm run cypress:visual
```
