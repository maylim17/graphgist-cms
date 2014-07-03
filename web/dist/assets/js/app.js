'use strict';
//1.set up routes
/* App Module */

var contentApp = angular.module('contentApp', [
  'ngRoute',
  'contentappControllers'
]);

contentApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/gists', {
        templateUrl: 'assets/partials/home.html',
        controller: 'GistListCtrl'
      }).
      when('/gists/:gistId', {
        templateUrl: 'assets/partials/gist-detail.html',
        controller: 'GistItemCtrl'
      }).
      when('/people/:peopleId', {
        templateUrl: 'assets/partials/people-detail.html',
        controller: 'PeopleItemCtrl'
      }).

      otherwise({
        redirectTo: '/gists'
      });
  }]);



