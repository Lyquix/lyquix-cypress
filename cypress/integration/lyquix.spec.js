/// <reference types="Cypress" />

const options = require('../fixtures/options');

let visitOptions = {};
if('httpUser' in options && options.httpUser != '') visitOptions.auth = {
	username: options.httpUser,
	password: options.httpPassword
};

options.testUrls.forEach((testUrl) => {
	describe('Lyquix Library on ' + testUrl, () => {
		before(() => {
			cy.visit(testUrl, visitOptions);
		});

		it('URL params in <body> attributes', () => {
			cy.get('body[domain]').should('exist');
			cy.get('body[path]').should('exist');
			cy.get('body[hash]').should('exist');
		});

		Object.keys(options.screens).forEach((size) => {
			it('<body> attributes for ' + size, () => {
				cy.viewport(options.screens[size][0], options.screens[size][1]);
				cy.wait(250);
				cy.get('body[screen]').should('exist').invoke('attr', 'screen').should('eq', size);
				cy.get('body[orientation]').should('exist');
			})
		});

		it('Geo-location <body> attributes', () => {
			cy.get('body[city]').should('exist');
			cy.get('body[subdivision]').should('exist');
			cy.get('body[country]').should('exist');
			cy.get('body[continent]').should('exist');
			cy.get('body[time-zone]').should('exist');
			cy.get('body[lat]').should('exist');
			cy.get('body[lon]').should('exist');
		});

		it('lqx exists', () => {
			cy.window().then((win) => {
				expect(win.lqx).to.be.an('object').to.have.any.keys(['options', 'vars', 'init', 'ready', 'log', 'warn', 'error', 'version']);
			});
		});

		it('lqx.detect.browser', () => {
			cy.window().then((win) => {
				expect(win.lqx.detect.browser()).to.have.keys(['name', 'type', 'version']);
			});
		});

		it('lqx.detect.mobile', () => {
			cy.window().then((win) => {
				expect(win.lqx.detect.mobile()).to.have.keys(['mobile', 'tablet', 'phone']);
			});
		});

		it('lqx.detect.os', () => {
			cy.window().then((win) => {
				expect(win.lqx.detect.os()).to.have.keys(['name', 'type', 'version']);
			});
		});

		it('lqx.detect.urlParams', () => {
			cy.window().then((win) => {
				expect(win.lqx.detect.urlParams()).to.be.an('object');
			});
		});

		it('lqx.detect.urlParts', () => {
			cy.window().then((win) => {
				expect(win.lqx.detect.urlParts()).to.have.keys(['domain', 'path', 'hash']);
			});
		});

		let testPoint = {};

		it('Get current lat/lon', () => {
			cy.get('body').then(() => {
				testPoint.lat = parseFloat(Cypress.$('body').attr('lat'));
				testPoint.lon = parseFloat(Cypress.$('body').attr('lon'));
			});
		});

		it('lqx.geolocate.inCircle', () => {
			cy.window().then((win) => {
				expect(win.lqx.geolocate.inCircle(testPoint, {lat:39.9526, lon:-75.1652}, 100)).to.be.true;
			});
		});

		it('lqx.geolocate.inPolygon', () => {
			cy.window().then((win) => {
				let USA = [
					{lat:49.65652, lon:-126.72532},
					{lat:47.47879, lon:-125.1325},
					{lat:44.77179, lon:-124.59436},
					{lat:40.71383, lon:-125.45168},
					{lat:36.89308, lon:-123.6507},
					{lat:33.47384, lon:-119.69716},
					{lat:31.57565, lon:-114.03144},
					{lat:30.8528, lon:-107.39891},
					{lat:28.62205, lon:-101.86824},
					{lat:24.4987, lon:-96.08034},
					{lat:27.89429, lon:-94.87562},
					{lat:28.3696, lon:-88.95057},
					{lat:29.31384, lon:-85.88953},
					{lat:27.18724, lon:-84.16197},
					{lat:23.94186, lon:-80.70686},
					{lat:25.0517, lon:-78.96604},
					{lat:31.23731, lon:-80.12562},
					{lat:35.18852, lon:-74.88617},
					{lat:40.02507, lon:-72.669},
					{lat:41.42474, lon:-68.23467},
					{lat:43.11747, lon:-69.20975},
					{lat:44.64155, lon:-66.06225},
					{lat:48.05996, lon:-66.71292},
					{lat:47.96441, lon:-69.82453},
					{lat:46.09251, lon:-71.7411},
					{lat:45.01553, lon:-78.03518},
					{lat:43.56866, lon:-81.13116},
					{lat:45.69482, lon:-82.04968},
					{lat:48.56395, lon:-86.52343},
					{lat:49.77051, lon:-95.11937},
					{lat:49.65669, lon:-110.65868}
				];
				expect(win.lqx.geolocate.inPolygon(testPoint, USA)).to.be.true;
			});
		});

		it('lqx.geolocate.inSquare', () => {
			cy.window().then((win) => {
				expect(win.lqx.geolocate.inSquare(testPoint, {lat:40.5, lon:-74}, {lat:39.5, lon:-76})).to.be.true;
			});
		});
	});
});
