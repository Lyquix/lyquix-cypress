const axios = require('axios');
const xml2js = require('xml2js');
const inquirer = require('inquirer');
const { spawn, exec } = require('child_process');
const checkboxPlusPrompt = require('inquirer-checkbox-plus-prompt');
const fuzzy = require('fuzzy');
const path = require('path');
const fs = require('fs');

inquirer.registerPrompt('checkbox-plus', checkboxPlusPrompt);

async function fetchSitemap(url) {
    try {
        const response = await axios.get(url);
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);

        // Check if the sitemap is a sitemap index
        if (result.sitemapindex && result.sitemapindex.sitemap) {
            const sitemapUrls = result.sitemapindex.sitemap.map(s => s.loc[0]);
            let allUrls = [];

            // Fetch each sitemap and collect URLs
            for (const sitemapUrl of sitemapUrls) {
                const urls = await fetchSitemap(sitemapUrl);
                allUrls = allUrls.concat(urls);
            }

            return allUrls;
        }

        // If it's a regular sitemap
        if (result.urlset && result.urlset.url) {
            return result.urlset.url.map(u => u.loc[0]);
        }

    } catch (error) {
        console.error('Error fetching or parsing sitemap:', error);
        process.exit(1);
    }
}

async function selectUrls(urls) {
    const answers = await inquirer.prompt([
        {
            type: 'checkbox-plus',
            name: 'selectedUrls',
            message: 'Search and select URLs to test:',
            pageSize: 10,
            highlight: true,
            searchable: true,
            source: (answersSoFar, input) => {
                input = input || '';
                return new Promise((resolve) => {
                    const fuzzyResult = fuzzy.filter(input, urls, {
                        extract: el => el
                    });
                    const data = fuzzyResult.map(element => element.original);
                    resolve(data);
                });
            }
        }
    ]);
    return answers.selectedUrls;
}

function getTestFilesToInclude(excludePatterns) {
    const files = fs.readdirSync('cypress/e2e');
    const includedFiles = files.filter(file => {
        return !excludePatterns.includes(`cypress/e2e/${file}`);
    }).map(file => `cypress/e2e/${file}`);
    return includedFiles;
}

async function runCypress(url) {
    return new Promise(async (resolve, reject) => {
        console.log('Running Cypress tests for:', url);

        const excludePatterns = [
            'cypress/e2e/accessibility.cy.js',
            'cypress/e2e/seo.cy.js',
            'cypress/e2e/visual.cy.js',
            'cypress/e2e/lighthouse.cy.js',
        ];

        const includedFiles = getTestFilesToInclude(excludePatterns);
        const specPattern = includedFiles.join(',');

        const cypress = spawn('npx', [
            'cypress', 'run',
            '--env', `url=${url}`,
            '--config', 'pageLoadTimeout=120000,requestTimeout=120000',
            '--spec', specPattern
        ]);

        cypress.stdout.on('data', (data) => {
            process.stdout.write(data);
        });

        cypress.stderr.on('data', (data) => {
            process.stderr.write(data);
        });

        cypress.on('close', (code) => {
            if (code !== 0) {
                console.log(`Cypress process exited with code ${code}`);
                resolve(new Error(`Cypress process exited with code ${code}`));
            } else {
                console.log('Cypress tests completed successfully');
                resolve();
            }
        });

        cypress.on('error', (err) => {
            console.error(`Failed to start Cypress subprocess: ${err.message}`);
            reject(err);
        });
    });
}

function execCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}`);
            } else if (stderr) {
                reject(`Stderr: ${stderr}`);
            } else {
                resolve(stdout);
            }
        });
    });
}

async function mergeReports(reportDir, outputDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const branch = (await execCommand('cd .. && git rev-parse --abbrev-ref HEAD')).trim();
    const commit = (await execCommand('cd .. && git rev-parse --short HEAD')).trim();

    const mergedReportDir = path.join(outputDir, branch);
    const mergedReportPath = path.join(mergedReportDir, `${timestamp}_${commit}.json`);

    if (!fs.existsSync(mergedReportDir)) {
        fs.mkdirSync(mergedReportDir, { recursive: true });
    }

    // Debugging: List report files
    const reportFiles = fs.readdirSync(reportDir);
    console.log(`Report files in ${reportDir}:`, reportFiles);

    console.log(`Merging reports from ${reportDir} to ${mergedReportPath}`);
    try {
        await execCommand(`npx mochawesome-merge ${reportDir}/mochawesome*.json > ${mergedReportPath}`);
        console.log('Reports merged successfully.');

        console.log('Removing merged JSON files.');
        fs.rmSync(reportDir, { recursive: true, force: true });

        return { mergedReportPath, branch, timestamp, commit };
    } catch (error) {
        console.error('Error merging reports:', error);
        throw error;
    }
}

async function generateHtmlReport(mergedReportPath, outputDir, reportName) {
    console.log(`Generating HTML report from ${mergedReportPath} to ${outputDir}`);
    try {
        await execCommand(`npx mochawesome-report-generator -f ${reportName} -o ${outputDir} --cdn true --charts true ${mergedReportPath}`);
        console.log('HTML report generated successfully.');

        const htmlReportPath = path.join(outputDir, `${reportName}.html`);
        const targetDir = path.resolve(__dirname, '../wp-content/uploads/cypress-reports');
        const targetPath = path.join(targetDir, `${reportName}.html`);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        fs.copyFileSync(htmlReportPath, targetPath);
        console.log(`HTML report copied to ${targetPath}`);
    } catch (error) {
        console.error('Error generating HTML report:', error);
        throw error;
    }
}

async function main() {
    const { useSitemap } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'useSitemap',
            message: 'Would you like to use a sitemap to retrieve URLs?',
            default: true
        }
    ]);

    let urls = [];
    let isSitemapSource = false; // Flag to check the source of URLs

    if (useSitemap) {
        const { sitemapUrl } = await inquirer.prompt([
            {
                type: 'input',
                name: 'sitemapUrl',
                message: 'Enter the sitemap URL:',
                validate: input => input ? true : 'Please enter a valid URL.'
            }
        ]);
        urls = await fetchSitemap(sitemapUrl);
        isSitemapSource = true; // URLs are from sitemap
    } else {
        const { manualUrls } = await inquirer.prompt([
            {
                type: 'input',
                name: 'manualUrls',
                message: 'Enter the list of URLs to test (comma separated):',
                validate: input => input ? true : 'Please enter at least one URL.'
            }
        ]);
        urls = manualUrls.split(',').map(url => url.trim());
    }

    const { selectAll } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'selectAll',
            message: 'Would you like to select all URLs from the sitemap?',
            default: false,
            when: () => isSitemapSource && urls.length > 1 // Only ask if the source is sitemap and more than one URL
        }
    ]);

    let selectedUrls = [];
    if (selectAll || !isSitemapSource) {
        selectedUrls = urls; // Select all URLs or proceed with manual list without asking
    } else {
        selectedUrls = await selectUrls(urls); // Show checkbox prompt to select specific URLs
    }

    const reportDir = 'cypress/reports/mochawesome';
    const outputDir = 'cypress/reports';

    try {
        for (const url of selectedUrls) {
            await runCypress(url);
        }

        const { mergedReportPath, branch, timestamp, commit } = await mergeReports(reportDir, outputDir);
        await generateHtmlReport(mergedReportPath, path.join(outputDir, branch), `${timestamp}_${commit}`);
    } catch (error) {
        console.error('Error during test execution or report generation:', error);
    }
}

main();
