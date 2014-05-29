/**
 *	@author Félix Girault <felix.girault@gmail.com>
 */
var co = require('co');
var should = require('should');
var Service = require('../../lib/service');
var OEmbed = require('../../lib/services/oembed');



/**
 *
 */
describe('OEmbed', function() {
	var oembed = null;

	beforeEach(function() {
		if (oembed) {
			delete oembed;
		}

		oembed = new OEmbed();
	});

	it('should extend Service', function() {
		oembed.should.be.an.instanceOf(Service);
	});

	describe('#_extractConfig', function() {
		it('should extract an OEmbed endpoint', function() {
			var config = oembed._extractConfig(
				'<html>'
					+ '<head>'
						+ '<link rel="alternate" type="application/json+oembed" href="http://json.com" />'
						+ '<link rel="alternate" type="application/xml+oembed" href="http://xml.com" />'
					+ '</head>'
				+ '</html>'
			);

			config.should.eql({
				endpoint: 'http://json.com',
				format: 'json'
			});
		});
	});

	describe('#_completeEndpoint', function() {
		it('should complete the endpoint', function() {
			var endpoint = oembed._completeEndpoint('url');

			endpoint.should.be.equal('url');
		});
	});

	describe('#_parseJson', function() {
		it('should parse a JSON string', function() {
			co(function *() {
				var json = { 'title': 'Title' };
				var data = yield oembed._parseJson(JSON.stringify(json));

				data.should.eql(json);
			})();
		});

		it('should throw an error when a JSON string cannot be parsed', function(done) {
			co(function *() {
				try {
					var data = yield oembed._parseJson('{,}');
				} catch (e) {
					done();
				}
			})();
		});
	});

	describe('#_parseXml', function() {
		it('should parse a XML string', function() {
			co(function *() {
				var data = yield oembed._parseXml(
					'<oembed>'
						+ '<title>Title</title>'
					+ '</oembed>'
				);

				data.should.have.property('title', 'Title');
			})();
		});

		it('should throw an error when a XML string cannot be parsed', function(done) {
			co(function *() {
				try {
					yield oembed._parseXml('<>');
				} catch (e) {
					done();
				}
			})();
		});
	});
});
