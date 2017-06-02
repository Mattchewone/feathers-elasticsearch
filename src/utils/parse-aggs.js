'use strict';

import { validateType } from './core';

const queryCriteriaMap = {
  $term: 'field.terms.size',
  $missing: 'field.missing'
};

const specialQueryHandlers = {
  $aggs: $aggs
};

function $aggs (value, esQuery) {
  if (!value) {
    return esQuery;
  }

  value
    .map(subQuery => parseAggs(subQuery))
    .filter(parsed => !!parsed)
    .forEach(parsed => {
      Object.keys(parsed)
        .forEach(section => {
          esQuery[section] = parsed[section];
        });
    });

  return esQuery;
}

function parseAggs (query) {
  let bool;

  validateType(query, 'query', ['object', 'null', 'undefined']);

  if (query === null || query === undefined) {
    return null;
  }

  bool = Object.keys(query)
    .reduce((result, key) => {
      let value = query[key];

      if (specialQueryHandlers[key]) {
        return specialQueryHandlers[key](value, result);
      }

      validateType(value, key, ['number', 'string', 'boolean', 'undefined', 'object', 'array']);
      // In this case the key is not $or and value is an object,
      // so we are most probably dealing with criteria.
      Object.keys(value)
        .filter(criterion => queryCriteriaMap[criterion])
        .forEach(criterion => {
          let [term, section, operand] = queryCriteriaMap[criterion].split('.');

          result[key] = {
            [section]: operand ? {
              [term]: value[criterion],
              [operand]: value[operand]
            } : { [term]: value[criterion] }
          };
        });

      return result;
    }, {});

  if (!Object.keys(bool).length) {
    return null;
  }

  return bool;
}

export { parseAggs };
