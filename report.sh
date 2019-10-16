#!/usr/bin/bash
###
#
# report.sh - Bash script to generate human-readable HTML reports
#
# @version     1.0.0
# @package     lyquix-tests
# @author      Lyquix
# @copyright   Copyright (C) 2015 - 2018 Lyquix
# @license     GNU General Public License version 2 or later
# @link        https://github.com/Lyquix/lyquix-tests
#
###

# Get current timestamp
T=$(date "+%Y-%m-%d_%H-%M-%S")

# Get current branch name
B=$(git rev-parse --abbrev-ref HEAD)

# Get current commit hash
C=$(git rev-parse --short HEAD)

# Run cypress on command line
npm run cypress:run

# Create directory to store report
mkdir -p cypress/reports/$B

# Merge generated json files
npx mochawesome-merge --reportDir cypress/reports/mochawesome > cypress/reports/$B/$T\_$C.json

# Remove merged json files
rm -r cypress/reports/mochawesome

# Generate HTML report
npx mochawesome-report-generator -f $T\_$C -o cypress/reports/$B --cdn true --charts true cypress/reports/$B/$T\_$C.json
