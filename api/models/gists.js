/**
 *  neo4j gist functions
 *  these are mostly written in a functional style
 */


var _ = require('underscore');
var uuid = require('hat'); // generates uuids
var Cypher = require('../neo4j/cypher');
var Gist = require('../models/neo4j/gist');
var async = require('async');
var randomName = require('random-name');


/*
 *  Utility Functions
 */

function _randomName () {
  return randomName.first() + ' ' + randomName.last();
}

function _randomNames (n) {
  return _.times(n, _randomName);
}


/**
 *  Result Functions
 *  to be combined with queries using _.partial()
 */

// return a single gist
var _singleGist = function (results, callback) {
  if (results.length) {
    callback(null, new Gist(results[0].gist));
  } else {
    callback(null, null);
  }
};

var _singleGistWithGenres = function (results, callback) {
    if (results.length)
    {
      var thisGist = new Gist(results[0].gist);
      thisGist.genres = results[0].genres;
      thisGist.usecases = results[0].usecases;
      thisGist.writers = results[0].writers;
      // thisGist.actors = results[0].actors;
      thisGist.related = results[0].related;
      thisGist.keywords = results[0].keywords;
      callback(null, thisGist);
    } else {
      callback(null, null);
    }
};

// return many gists
var _manyGists = function (results, callback) {
  var gists = _.map(results, function (result) {
    return new Gist(result.gist);
  });

  callback(null, gists);
};

var _manyGistsWithGenres = function (results, callback) {
  var gists = _.map(results, function (result) {
    var thisGist = new Gist(result.gist);
    thisGist.genres = result.genres;
    return thisGist;
  });

  callback(null, gists);
};

// return a count
var _singleCount = function (results, callback) {
  if (results.length) {
    callback(null, {
      count: results[0].c || 0
    });
  } else {
    callback(null, null);
  }
};


/**
 *  Query Functions
 *  to be combined with result functions using _.partial()
 */


var _matchBy = function (keys, params, options, callback) {
  var cypher_params = _.pick(params, keys);

  var query = [
    'MATCH (gist:Gist)',
    Cypher.where('gist', keys),
    'RETURN gist  AS gist'
  ].join('\n');

  callback(null, query, cypher_params);
};

// var _matchById = function (params, options, callback) {
//   var cypher_params = {
//     n: parseInt(params.id || 1)
//   };

//   var query = [
//     'MATCH (gist:Gist)',
//     'WHERE id(gist) = {n}',
//     'RETURN gist'
//   ].join('\n');

//   callback(null, query, cypher_params);
// };


// var _getByDateRange = function (params, options, callback) {
//   var cypher_params = {
//     start: parseInt(params.start || 0),
//     end: parseInt(params.end || 0)
//   };

//   var query = [
//     'MATCH (gist:Gist)',
//     'WHERE gist.released > {start} AND gist.released < {end}',
//     'RETURN gist'
//   ].join('\n');

//   callback(null, query, cypher_params);
// };

var _getGistsWithGenres = function (params, options, callback) {
  var cypher_params = {};
  var query = [
    'MATCH (gist:Gist)',
    'WITH gist',
    'OPTIONAL MATCH (domain)<-[:HAS_DOMAIN]-(gist)',
    'WITH gist, domain', 
    'RETURN gist as gist, collect(domain.name) as genres',
    'ORDER BY gist.released DESC'
  ].join('\n');

  callback(null, query, cypher_params);
};

var _getGistByTitle = function (params, options, callback) {
  var cypher_params = {
    title: params.title
  };
  console.log(cypher_params.title);
  var query = [
    // 'MATCH (gist:Gist {title: {title} })<-[:ACTED_IN]-(actor)',
    // 'WITH gist, actor, length((actor)-[:ACTED_IN]->()) as actorgistsweight',
    // 'ORDER BY actorgistsweight DESC',
    // 'WITH gist, collect({name: actor.name, poster_image: actor.poster_image, weight: actorgistsweight}) as actors', 
    'MATCH (gist:Gist {title: {title} })-[:HAS_DOMAIN]->(domain)',
    'WITH gist, collect(domain.name) as domains',
    'MATCH (usecase)<-[:HAS_USECASE]-(gist)',
    'WITH gist, domains, collect(usecase.name) as usecases',
    'MATCH (writer)-[:WRITER_OF]->(gist)',
    'WITH gist, domains, usecases, collect(writer.name) as writers',
    'MATCH (gist)-[:HAS_KEYWORD]->(keyword)<-[:HAS_KEYWORD]-(gists:Gist)',
    'WITH DISTINCT gists as related, count(DISTINCT keyword.name) as keywords, gist, domains, usecases, writers',
    'ORDER BY keywords DESC',
    'WITH collect(DISTINCT { related: { title: related.title, poster_image: related.poster_image }, weight: keywords }) as related, gist, domains, usecases, writers',
    'MATCH (gist)-[:HAS_KEYWORD]->(keyword)',
    'WITH keyword, related, gist, domains, usecases, writers',
    'LIMIT 10',
    'RETURN related, collect(keyword.name) as keywords, gist as gist, domains as genres, usecases, writers'
    //related, collect(keyword.name) as keywords (add to RETURN STATEMENT)
  ].join('\n');

  callback(null, query, cypher_params);
};

var _matchByGenre = function (params, options, callback) {
  var cypher_params = {
    name: params.name
  };

  var query = [
    'MATCH (gist:Gist)-[:HAS_DOMAIN]->(domain)',
    'WHERE domain.name = {name}',
    'RETURN gist as gist'
  ].join('\n');

  callback(null, query, cypher_params);
};

// var _getByActor = function (params, options, callback) {
//   var cypher_params = {
//     name: params.name
//   };

//   var query = [
//     'MATCH (actor:Person {name: {name} })',
//     'MATCH (actor)-[:ACTED_IN]->(gist)', 
//     'RETURN gist'
//   ].join('\n');

//   callback(null, query, cypher_params);
// };


// var _matchByUUID = Cypher(_matchById, ['id']);
var _matchByTitle = Cypher(_getGistByTitle, _singleGistWithGenres);

var _matchAll = _.partial(_matchBy, []);


// gets n random gists
var _getRandom = function (params, options, callback) {
  var cypher_params = {
    n: parseInt(params.n || 1)
  };

  var query = [
    'MATCH (gist:Gist)',
    'RETURN gist as gist, rand() as rnd',
    'ORDER BY rnd',
    'LIMIT {n}'
  ].join('\n');

  callback(null, query, cypher_params);
};

var _getAllCount = function (params, options, callback) {
  var cypher_params = {};

  var query = [
    'MATCH (gist:Gist)',
    'RETURN COUNT(gist) as c'
  ].join('\n');

  callback(null, query, cypher_params);
};

var _updateName = function (params, options, callback) {
  var cypher_params = {
    id : params.id,
    name : params.name
  };

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ id?
  var query = [
    'MATCH (gist:Gist {id:{id}})',
    'SET gist.name = {name}',
    'RETURN gist as gist'
  ].join('\n');

  callback(null, query, cypher_params);
};

// creates the gist with cypher
var _create = function (params, options, callback) {
  var cypher_params = {
    id: params.id || uuid(),
    name: params.name
  };
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ gist name?
  var query = [
    'MERGE (gist:Gist {name: {name}, id: {id}})',
    'ON CREATE',
    'SET gist.created = timestamp()',
    'ON MATCH',
    'SET gist.lastLogin = timestamp()',
    'RETURN gist as gist'
  ].join('\n');

  callback(null, query, cypher_params);
};

// delete the gist and any relationships with cypher
var _delete = function (params, options, callback) {
  var cypher_params = {
    id: params.id
  };

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ id?
  var query = [
    'MATCH (gist:Gist {id:{id}})',
    'OPTIONAL MATCH (gist)-[r]-()',
    'DELETE gist, r',
  ].join('\n');
  callback(null, query, cypher_params);
};

// delete all gists
var _deleteAll = function (params, options, callback) {
  var cypher_params = {};

  var query = [
    'MATCH (gist:Gist)',
    'OPTIONAL MATCH (gist)-[r]-()',
    'DELETE gist, r',
  ].join('\n');
  callback(null, query, cypher_params);
};


// exposed functions


// get a single gist by id
// var getById = Cypher(_matchById, _singleGist);

// Get by date range
// var getByDateRange = Cypher(_getByDateRange, _manyGists);

// Get by date range
//var getByActor = Cypher(_getByActor, _manyGists);

// get a single gist by name
var getByTitle = Cypher(_getGistByTitle, _singleGistWithGenres);

// get a gist by id and update their name
var updateName = Cypher(_updateName, _singleGist);

// get a gist by genre
var getByGenre = Cypher(_matchByGenre, _manyGists);

var getManyGistsWithGenres = Cypher(_getGistsWithGenres, _manyGistsWithGenres);

// create a new gist
var create = Cypher(_create, _singleGist);

// create many new gists
var createMany = function (params, options, callback) {
  if (params.names && _.isArray(params.names)) {
    async.map(params.names, function (name, callback) {
      create({name: name}, options, callback);
    }, function (err, responses) {
      Cypher.mergeReponses(err, responses, callback);
    });
  } else if (params.gists && _.isArray(params.gists)) {
    async.map(params.gists, function (gist, callback) {
      create(_.pick(gist, 'name', 'id'), options, callback);
    }, function (err, responses) {
      Cypher.mergeReponses(err, responses, callback);
    });
  } else {
    callback(null, []);
  }
};

var createRandom = function (params, options, callback) {
  var names = _randomNames(params.n || 1);
  createMany({names: names}, options, callback);
};

// login a gist
var login = create;

// get all gists
var getAll = Cypher(_matchAll, _manyGists);

// get all gists count
var getAllCount = Cypher(_getAllCount, _singleCount);

// delete a gist by id
var deleteGist = Cypher(_delete);

// delete a gist by id
var deleteAllGists = Cypher(_deleteAll);

// reset all gists
var resetGists = function (params, options, callback) {
  deleteAllGists(null, options, function (err, response) {
    if (err) return callback(err, response);
    createRandom(params, options, function (err, secondResponse) {
      if (err) return Cypher.mergeRaws(err, [response, secondResponse], callback);
      manyFriendships({
        gists: secondResponse.results,
        friendships: params.friendships
      }, options, function (err, finalResponse) {
        // this doesn't return all the gists, just the ones with friends
        Cypher.mergeRaws(err, [response, secondResponse, finalResponse], callback);
      });
    });
  });
};

// export exposed functions

module.exports = {
  getAll: getManyGistsWithGenres,
  // getById: getById,
  getByTitle: getByTitle,
  // getByDateRange: getByDateRange,
//  getByActor: getByActor,
  getByGenre: getByGenre
};