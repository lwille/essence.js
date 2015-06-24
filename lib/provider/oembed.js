/**
 *	@author Félix Girault <felix.girault@gmail.com>
 */
'use strict';

var _ = require('lodash');
var util = require('util');
var query = require('querystring');
var xml2js = require('xml2js');
var cheerio = require('cheerio');
var Provider = require('../provider');



/**
 *	Constructor.
 *
 *	@see Provider.
 */
var OEmbed = function(options) {
	Provider.call(this, _.merge({
		endpoint: '',
		format: 'json',
		reindex: {
			'author_name': 'authorName',
			'author_url': 'authorUrl',
			'provider_name': 'providerName',
			'provider_url': 'providerUrl',
			'cache_age': 'cacheAge',
			'thumbnail_url': 'thumbnailUrl',
			'thumbnail_width': 'thumbnailWidth',
			'thumbnail_height': 'thumbnailHeight'
		}
	}, options));
};

util.inherits(OEmbed, Provider);



/**
 *	@see Provider#_extract.
 */
OEmbed.prototype._extract = function *(url, options) {
	var config = yield this._config(url, options);
	var body = yield this._get(config.endpoint);

	switch (config.format) {
		case 'json': return this._parseJson(body);
		case 'xml': return yield this._parseXml(body);
		default:
			throw new Error('Unsupported response format');
	}
};



/**
 *	Returns an OEmbed configuration, either from internal configuration or by
 *	extracting it from the given URL.
 *
 *	@param {string} url URL.
 *	@param {object} options Options.
 *	@returns {object} Configuration.
 */
OEmbed.prototype._config = function *(url, options) {
	var config = this._options.endpoint
		? this._buildConfig(url)
		: this._extractConfig(yield this._get(url));

	if (options) {
		config.endpoint = this._completeEndpoint(config.endpoint, options);
	}

	return config;
};



/**
 *	Builds a configuration from the configured endpoint scheme and format.
 *
 *	@param {string} url URL.
 *	@returns {object} Configuration.
 */
OEmbed.prototype._buildConfig = function(url) {
	return {
		endpoint: this._options.endpoint.replace(':url', encodeURIComponent(url)),
		format: this._options.format
	};
};



/**
 *	Searches for an OEmbed meta tag in the given HTML string and returns its
 *	endpoint and format.
 *
 *	@param {string} html HTML.
 *	@returns {object} Configuration.
 */
OEmbed.prototype._extractConfig = function(html) {
	var $ = cheerio.load(html);
	var links = $('link', 'head');
	var config = {};

	links.each(function(i, link) {
		var type = $(link).attr('type');
		var href = $(link).attr('href');

		if (type && href) {
			var matches = /application\/(json|xml)\+oembed/i.exec(type);

			if (matches && matches[1]) {
				config.endpoint = href;
				config.format = matches[1];
				return false;
			}
		}
	});

	if (config.length === 0) {
		throw new Error('Unable to extract any OEmbed endpoint');
	}

	return config;
};



/**
 *	Parses the given JSON string.
 *
 *	@param {string} endpoint OEmbed endpoint.
 *	@param {object} options Options.
 *	@returns {string} json JSON string.
 */
OEmbed.prototype._completeEndpoint = function(endpoint, options) {
	var hasQueryString = (endpoint.indexOf('?') !== -1);

	return endpoint
		+ (hasQueryString ? '&' : '?')
		+ query.stringify(options);
};



/**
 *	Parses the given JSON string.
 *
 *	@param {string} json JSON string.
 *	@returns {object} JSON data.
 */
OEmbed.prototype._parseJson = function(json) {
	try {
		return JSON.parse(json);
	} catch (e) {
		throw new Error('Error parsing JSON: ' + e);
	}
};



/**
 *	Parses the given XML string.
 *
 *	@param {string} xml XML string.
 *	@return {function} Thunk.
 */
OEmbed.prototype._parseXml = function(xml) {
	return function(cb) {
		xml2js.parseString(xml, {
			explicitArray: false
		}, function(error, data) {
			if (error) {
				cb('Error parsing XML: ' + error);
			} else {
				cb(null, data.oembed);
			}
		});
	};
};



module.exports = OEmbed;