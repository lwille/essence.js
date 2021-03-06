import {expect} from 'chai';
import {createRequest} from '../src';



describe('createRequest', function() {
	describe('url', function() {
		it('should return the URL', function() {
			const url = 'url';
			const request = createRequest(url);

			expect(request.url()).to.equal(url);
		});
	});

	describe('withUrl', function() {
		it('should return a new Request without affecting the original one', function() {
			const url = 'url';
			const otherUrl = 'other-url';
			const request = createRequest(url);
			const otherRequest = request.withUrl(otherUrl);

			expect(request.url()).to.equal(url);
			expect(otherRequest.url()).to.equal(otherUrl);
		});
	});
});
