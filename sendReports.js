const { exec } = require('child_process');
const nodemailer = require('nodemailer');
const axios = require('axios');
const glob = require('glob');
const path = require('path');
const fs = require('fs');
const twilio = require('twilio');

const config = readConfig();
// Configure Twilio
const twilioClient = twilio(config.TWILIO_SID, config.TWILIO_AUTH);
const twilioFromNumber = config.TWILIO_PHONE;

function readConfig() {
    const configPath = path.resolve(__dirname, 'lqx.config.json');
    if (!fs.existsSync(configPath)) {
        console.error('Error: Configuration file config.json not found.');
        process.exit(1);
    }

    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return config;
    } catch (error) {
        console.error('Error reading or parsing config.json:', error);
        process.exit(1);
    }
}

// Configure Nodemailer to use Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.GMAIL_USER,  // Your Gmail address
        pass: config.GMAIL_PASS   // Your app password
    }
});

// Function to get the latest report
function getLatestReport(directory) {
    const files = glob.sync(`${directory}/*.html`);
    if (files.length === 0) {
        return null;
    }
    const latestFile = files.map(file => ({
        file,
        mtime: fs.statSync(file).mtime
    })).sort((a, b) => b.mtime - a.mtime)[0].file;

    return path.basename(latestFile);
}

// Function to send email
async function sendEmail(to, subject, body, attachment) {
    const mailOptions = {
        from: config.GMAIL_USER,
        to,
        subject,
        html: body,
        attachments: [
            {
                path: attachment
            }
        ]
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email has been sent');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Function to send Slack message
async function sendSlackMessage(webhookUrl, message) {
    try {
        const response = await axios.post(webhookUrl, { text: message });
        if (response.status === 200) {
            console.log('Slack message sent successfully');
        } else {
            console.error('Failed to send Slack message');
        }
    } catch (error) {
        console.error('Error sending Slack message:', error);
    }
}

// Function to send SMS
async function sendSMS(to, message) {
    try {
        await twilioClient.messages.create({
            body: message,
            from: twilioFromNumber,
            to
        });
        console.log('SMS sent successfully');
    } catch (error) {
        console.error('Error sending SMS:', error);
    }
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

(async () => {
    const branch = (await execCommand('cd .. && git rev-parse --abbrev-ref HEAD')).trim();
    const reportDirectory = `cypress/reports/${branch}`;
    const reportName = getLatestReport(reportDirectory).replace('html', '');
    const stats = JSON.parse(fs.readFileSync(reportDirectory + '/' + reportName + 'json', 'utf-8')).stats

    const emailRecipient = config.GMAIL_USER;
    const emailSubject = 'Mochawesome Report';
    const emailBody = 'Please find the attached Mochawesome report.';
    const slackMessage = `${stats.passes}/${stats.tests} passed. Please check the attached file. https://${domain}/wp-content/uploads/cypress-reports/${reportName}html`;
    const smsMessage = `${stats.passes}/${stats.tests} tests passed. Report: https://${domain}/wp-content/uploads/cypress-reports/${reportName}html`;
    const slackWebhookUrl = config.SLACK_WEBHOOK;
    const domain = config.DOMAIN;

    try {
        // Send the report via Email
        await sendEmail(emailRecipient, emailSubject, emailBody, `${reportDirectory}/${reportName}html`);

        // Send the report notification via Slack
        await sendSlackMessage(slackWebhookUrl, slackMessage);

        // Send the report notification via SMS
        await sendSMS(config.TO_PHONE, smsMessage);

        console.log("All notifications sent.");
    } catch (error) {
        console.error('Error during test execution or notification:', error);
    }
})();
