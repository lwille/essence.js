/**
 *
 */
import axios from 'axios';
import memoize from 'lodash/function/memoize';
import Container from './Container';
import extractor from './extractor';
import pipeline from './pipeline';
import condition from './condition';
import isYoutubeRequest from './conditions/isYoutubeRequest';
import isEmptyResponse from './conditions/isEmptyResponse';
import youtubePreparator from './preparators/youtube';
import metaTagsExtractor from './extractors/metaTags';
import {FORMAT_JSON, FORMAT_XML} from './extractors/oEmbedFormats';
import oEmbedKnownExtractor from './extractors/oEmbedKnown';
import oEmbedAutoExtractor from './extractors/oEmbedAuto';
import mapperPresenter from './presenters/mapper';
import fillUrl from './presenters/fillUrl';



/**
 *
 */
const container = new Container();

container.setUnique('getHeaders', () => {
	const head = memoize(axios.head);

	return async function(url) {
		return head(url).then(response => response.headers);
	};
});

container.setUnique('getBody', () => {
	const get = memoize(axios.get);

	return async function(url) {
		return get(url).then(response => response.data);
	};
});

container.setUnique('youtubePreparator', youtubePreparator);

container.setUnique('oEmbedServices', () => ({
	'youtube': {
		filter: /youtube\.com|youtu\.be/i,
		endpoint: 'http://www.youtube.com/oembed?format=xml&url=:url',
		format: FORMAT_XML
	}
}));

container.setUnique('oEmbedKnownExtractor', () => {
	return oEmbedKnownExtractor(
		container.get('getBody'),
		container.get('oEmbedServices')
	);
});

container.setUnique('oEmbedAutoExtractor', () => {
	return oEmbedAutoExtractor(
		container.get('getBody')
	);
});

container.setUnique('openGraphExtractor', () => {
	return metaTagsExtractor(
		container.get('getBody'),
		/^og:/i
	);
});

container.setUnique('openGraphMapper', () => {
	return mapperPresenter({
		'og:url': 'url',
		'og:type': 'type',
		'og:title': 'title',
		'og:description': 'description',
		'og:site_name': 'providerName',
		'og:image': 'thumbnailUrl',
		'og:image:url': 'thumbnailUrl',
		'og:image:width': 'width',
		'og:image:height': 'height',
		'og:video:width': 'width',
		'og:video:height': 'height'
	});
});

container.setUnique('twitterTagsExtractor', () => {
	return metaTagsExtractor(
		container.get('getBody'),
		/^twitter:/i
	);
});

container.setUnique('twitterTagsMapper', () => {
	return mapperPresenter({
		'twitter:card': 'type',
		'twitter:title': 'title',
		'twitter:description': 'description',
		'twitter:site': 'providerName',
		'twitter:creator': 'authorName'
	});
});

container.setUnique('middlewares', () => {
	return [
		condition(
			isYoutubeRequest,
			container.get('youtubePreparator')
		),
		condition(
			isEmptyResponse,
			container.get('oEmbedKnownExtractor')
		),
		//	condition(
		//		isEmptyResponse,
		//		container.get('oEmbedAutoExtractor')
		//	),
		condition(
			isEmptyResponse,
			pipeline(
				container.get('openGraphExtractor'),
				container.get('openGraphMapper')
			)
		),
		condition(
			isEmptyResponse,
			pipeline(
				container.get('twitterTagsExtractor'),
				container.get('twitterTagsMapper')
			)
		),
		//	condition(
		//		isYoutubeRequest,
		//		youtubePresenter()
		//	),
		fillUrl
	];
});

container.setUnique('extractor', () => {
	return extractor(
		container.get('middlewares')
	);
});



export default container;