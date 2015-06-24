/**
 *	@author Félix Girault <felix.girault@gmail.com>
 */
'use strict';

var _ = require('lodash');
var util = require('util');
var MetaTags = require('../metatags');



/**
 *	Constructor.
 *
 *	@see MetaTags
 */
var TwitterCards = function(options) {
	MetaTags.call(this, _.merge({
		scheme: /^twitter:/i,
		reindex: {
			'twitter:card': 'type',
			'twitter:title': 'title',
			'twitter:description': 'description',
			'twitter:site': 'providerName',
			'twitter:creator': 'authorName'
		}
	}, options));

	// a bit ugly
	this._options.complete.templates.player = this._options.complete.templates.video;
};

util.inherits(TwitterCards, MetaTags);



/**
 *	Reindexes information depending of the media type.
 *
 *	@see MetaTags#_reindexInfos.
 */
TwitterCards.prototype._reindexInfos = function(infos, map) {
	var reindex = MetaTags.prototype._reindexInfos.bind(this);
	infos = reindex(infos, map);

	if (infos.type && infos.type === 'player') {
		infos = reindex(infos, {
			'twitter:player': 'url',
			'twitter:player:width': 'width',
			'twitter:player:height': 'height',
			'twitter:image': 'thumbnailUrl',
			'twitter:image:width': 'thumbnailWidth',
			'twitter:image:height': 'thumbnailHeight'
		});
	} else {
		infos = reindex(infos, {
			'twitter:image': 'url',
			'twitter:image:width': 'width',
			'twitter:image:height': 'height'
		});
	}

	return infos;
};



module.exports = TwitterCards;