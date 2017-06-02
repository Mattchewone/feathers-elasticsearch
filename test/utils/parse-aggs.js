/* eslint-env mocha */
// The following is required for some of the Chai's `expect` assertions,
// e.g. expect(someVariable).to.be.empty;
/* eslint no-unused-expressions: "off" */
import { expect } from 'chai';
import { parseAggs } from '../../src/utils';
import { errors } from 'feathers-errors';

export default function parseAggsTests () {
  describe('parseAggs', () => {
    it('should return null if query is null or undefined', () => {
      expect(parseAggs(null)).to.be.null;
      expect(parseAggs()).to.be.null;
    });

    it('should return null if query has no own properties', () => {
      let query = Object.create({ hello: 'world' });

      expect(parseAggs({})).to.be.null;
      expect(parseAggs(query)).to.be.null;
    });

    it('should throw BadRequest if query is not an object, null or undefined', () => {
      expect(() => parseAggs(12)).to.throw(errors.BadRequest);
      expect(() => parseAggs(true)).to.throw(errors.BadRequest);
      expect(() => parseAggs('abc')).to.throw(errors.BadRequest);
      expect(() => parseAggs([])).to.throw(errors.BadRequest);
    });

    it('should return terms aggregation for each term aggregation', () => {
      let query = {
        $aggs: [{
          tags_agg: { $term: 'tags', size: 100 }
        },
        {
          genre_agg: { $term: 'genre', size: 100 }
        }]
      };
      let expectedResult = {
        tags_agg: {
          terms: { field: 'tags', size: 100 }
        },
        genre_agg: {
          terms: { field: 'genre', size: 100 }
        }
      };

      expect(parseAggs(query)).to
        .deep.equal(expectedResult);
    });

    it('should return aggregation for each mising aggregation', () => {
      let query = {
        $aggs: [{
          missing_tags_agg: { $missing: 'tags' }
        },
        {
          missing_genre_agg: { $missing: 'genre' }
        }]
      };
      let expectedResult = {
        missing_tags_agg: {
          missing: { field: 'tags' }
        },
        missing_genre_agg: {
          missing: { field: 'genre' }
        }
      };

      expect(parseAggs(query)).to
        .deep.equal(expectedResult);
    });

    it('should ignore size for $missing $aggs query', () => {
      let query = {
        $aggs: [{
          missing_tags_agg: { $missing: 'tags', size: 10 }
        }]
      };
      let expectedResult = {
        missing_tags_agg: {
          missing: { field: 'tags' }
        }
      };

      expect(parseAggs(query)).to
        .deep.equal(expectedResult);
    });

    it('should mix terms and missing $aggs', () => {
      let query = {
        $aggs: [{
          missing_tags_agg: { $missing: 'tags' }
        },
        {
          genre_agg: { $term: 'genre', size: 10 }
        }]
      };
      let expectedResult = {
        missing_tags_agg: {
          missing: { field: 'tags' }
        },
        genre_agg: {
          terms: { field: 'genre', size: 10 }
        }
      };

      expect(parseAggs(query)).to
        .deep.equal(expectedResult);
    });

    it('should only process $aggs query params', () => {
      let query = {
        tags: ['javascript'],
        user: 'doug',
        $aggs: [{
          tags_agg: { $term: 'tags', size: 40 }
        },
        {
          genre_agg: { $term: 'genre', size: 10 }
        }]
      };
      let expectedResult = {
        tags_agg: {
          terms: { field: 'tags', size: 40 }
        },
        genre_agg: {
          terms: { field: 'genre', size: 10 }
        }
      };

      expect(parseAggs(query)).to
        .deep.equal(expectedResult);
    });
  });
}
