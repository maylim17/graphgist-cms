/**
 *  neo4j person functions
 *  these are mostly written in a functional style
 */


var _ = require('underscore');
var uuid = require('hat'); // generates uuids
var Cypher = require('../neo4j/cypher');
var Role = require('../models/neo4j/role');
var Person = require('../models/neo4j/person');
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

// return a single person
var _singlePerson = function (results, callback) {
  if (results.length) {
    var person = new Person(results[0].person);
    person.movies = results[0].movie;
    person.related = results[0].related;
    callback(null, person);
  } else {
    callback(null, null);
  }
};

// return many people
var _manyPersons = function (results, callback) {
  var people = _.map(results, function (result) {
    return new Person(result.person);
  });

  callback(null, people);
};

var _manyRoles = function (results, callback) {
  var roles = _.map(results, function (result) {
    return new Role(result);
  });

  callback(null, roles);
}

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
    'MATCH (node)',
    'WHERE node:Domain OR node:UseCase',
    'WITH node',
    'MATCH (node)',
    Cypher.where('node', keys),
    'RETURN node as person'
  ].join('\n');

  callback(null, query, cypher_params);
};



var _getDirectorByMovie = function (params, options, callback) {
  var cypher_params = {
    title: params.title
  };

  var query = [
    'MATCH (movie:Gist {title: {title}})',
    'MATCH (person)<-[:HAS_USECASE]-(movie)', 
    'RETURN DISTINCT person'
  ].join('\n');

  callback(null, query, cypher_params);
};

// var _getCoActorsByPerson = function (params, options, callback) {
//   var cypher_params = {
//     name: params.name
//   };

//   var query = [
//     'MATCH (actor:Person {name: {name}})',
//     'MATCH (actor)-[:ACTED_IN]->(m)',
//     'WITH m, actor',
//     'MATCH (m)<-[:ACTED_IN]-(person:Person)',
//     'WHERE actor <> person', 
//     'RETURN person'
//   ].join('\n');

//   callback(null, query, cypher_params);
// };

// var _getRolesByMovie = function (params, options, callback) {
//   var cypher_params = {
//     title: params.title
//   };

//   var query = [
//     'MATCH (movie:Gist {title: {title}})',
//     'MATCH (people:Person)-[relatedTo]-(movie)', 
//     'RETURN { movietitle: movie.title, name: people.name, roletype: type(relatedTo) } as role'
//   ].join('\n');

//   callback(null, query, cypher_params);
// };

var _getViewByName = function (params, options, callback) {
  var cypher_params = {
    name: params.name
  };

  var query = [
    // 'MATCH (node)', 
    // 'WHERE node:Domain OR node:UseCase AND node.name= {name}',
    // 'WITH node',
    'MATCH (node:Category {name: {name}})-[relatedTo]-(gists:Gist)',  
    'OPTIONAL MATCH (node)<-[:HAS_USECASE|HAS_DOMAIN]-(gist)-[:HAS_USECASE|HAS_DOMAIN]->(nodes)',
    'WITH DISTINCT { name: nodes.name, poster_image: nodes.poster_image } as related, count(DISTINCT gists) as weight, gist, node',
    'ORDER BY weight DESC',
    'RETURN collect(DISTINCT { title: gist.title, poster_image: gist.poster_image }) as movie, collect(DISTINCT { related: related, weight: weight }) as related, node as person'
  ].join('\n');

  callback(null, query, cypher_params);
};



// var _matchByUUID = _.partial(_matchBy, ['id']);
var _matchAll = _.partial(_matchBy, []);

// gets n random people
var _getRandom = function (params, options, callback) {
  var cypher_params = {
    n: parseInt(params.n || 1)
  };

  var query = [
    'MATCH (node)',
    'WHERE node:Domain OR node:UseCase',
    'RETURN node, rand() as rnd',
    'ORDER BY rnd',
    'LIMIT {n}'
  ].join('\n');

  callback(null, query, cypher_params);
};

var _getAllCount = function (params, options, callback) {
  var cypher_params = {};

  var query = [
    'MATCH (node)',
    'WHERE node:Domain OR node:UseCase',
    'RETURN COUNT(node) as c'
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
    'MATCH (node)',
    'WHERE node:Domain OR node:UseCase',
    'WITH node',
    'MATCH (node {id:{id}})',
    'SET node.name = {name}',
    'RETURN node as person'
  ].join('\n');

  callback(null, query, cypher_params);
};

// creates the person with cypher
var _create = function (params, options, callback) {
  var cypher_params = {
    id: params.id || uuid(),
    name: params.name
  };

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ id?
  var query = [
    'MERGE (node)',
    'WHERE node:Domain OR node:UseCase',
    'WITH node',
    'MERGE (node {name: {name}, id: {id}})',
    'ON CREATE',
    'SET node.created = timestamp()',
    'ON MATCH',
    'SET node.lastLogin = timestamp()',
    'RETURN node as person'
  ].join('\n');

  callback(null, query, cypher_params);
};

// delete the person and any relationships with cypher
var _delete = function (params, options, callback) {
  var cypher_params = {
    id: params.id
  };

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ id?
  var query = [
    'MATCH (node)',
    'WHERE node:Domain OR node:UseCase',
    'WITH node',
    'MATCH (node {id:{id}})',
    'OPTIONAL MATCH (node)-[r]-()',
    'DELETE node, r',
  ].join('\n');
  callback(null, query, cypher_params);
};

// delete all people
var _deleteAll = function (params, options, callback) {
  var cypher_params = {};

  var query = [
    'MATCH (node)',
    'OPTIONAL MATCH (node)-[r]-()',
    'WHERE node:Domain OR node:UseCase',
    'DELETE node, r',
  ].join('\n');
  callback(null, query, cypher_params);
};

// get a single person by id
// var getById = Cypher(_matchByUUID, _singlePerson);

// get a single person by name
var getByName = Cypher(_getViewByName, _singlePerson);

// Get a director of a movie
// var getDirectorByMovie = Cypher(_getDirectorByMovie, _singlePerson);

// get movie roles
// var getRolesByMovie = Cypher(_getRolesByMovie, _manyRoles);

// Get a director of a movie
// var getCoActorsByPerson = Cypher(_getCoActorsByPerson, _manyPersons);

// get n random people
var getRandom = Cypher(_getRandom, _manyPersons);

// // get n random people
// var getRandomWithFriends = Cypher(_getRandomWithFriends, _manyPersonsWithFriends);

// get a person by id and update their name
var updateName = Cypher(_updateName, _singlePerson);

// create a new person
var create = Cypher(_create, _singlePerson);

// create many new people
var createMany = function (params, options, callback) {
  if (params.names && _.isArray(params.names)) {
    async.map(params.names, function (name, callback) {
      create({name: name}, options, callback);
    }, function (err, responses) {
      Cypher.mergeReponses(err, responses, callback);
    });
  } else if (params.people && _.isArray(params.people)) {
    async.map(params.people, function (person, callback) {
      create(_.pick(person, 'name', 'id'), options, callback);
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

// login a person
var login = create;

// get all people
var getAll = Cypher(_matchAll, _manyPersons);

// get all people count
var getAllCount = Cypher(_getAllCount, _singleCount);

// delete a person by id
var deletePerson = Cypher(_delete);

// delete a person by id
var deleteAllPersons = Cypher(_deleteAll);

// reset all people
var resetPersons = function (params, options, callback) {
  deleteAllPersons(null, options, function (err, response) {
    if (err) return callback(err, response);
    createRandom(params, options, function (err, secondResponse) {
      if (err) return Cypher.mergeRaws(err, [response, secondResponse], callback);
      manyFriendships({
        people: secondResponse.results,
        friendships: params.friendships
      }, options, function (err, finalResponse) {
        // this doesn't return all the people, just the ones with friends
        Cypher.mergeRaws(err, [response, secondResponse, finalResponse], callback);
      });
    });
  });
};

// export exposed functions

module.exports = {
  getAll: getAll,
  // getById: getById,
  getByName: getByName,
  // getDirectorByMovie: getDirectorByMovie,
  // getCoActorsByPerson: getCoActorsByPerson,
  // getRolesByMovie: getRolesByMovie
};