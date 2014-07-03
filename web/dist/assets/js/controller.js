'use strict';

/* Controllers */

angular.module('SharedServices', [])
    .config(function ($httpProvider) {
        $httpProvider.responseInterceptors.push('myHttpInterceptor');
        var spinnerFunction = function (data, headersGetter) {
            // todo start the spinner here
            //alert('start spinner');
            $('#mydiv').show();
            return data;
        };
        $httpProvider.defaults.transformRequest.push(spinnerFunction);
    })
// register the interceptor as a service, intercepts ALL angular ajax http calls
    .factory('myHttpInterceptor', function ($q, $window) {
        return function (promise) {
            return promise.then(function (response) {
                // do something on success
                // todo hide the spinner
                //alert('stop spinner');
                $('#mydiv').hide();
                $('.hidden-content').removeClass('hidden-content');
                return response;

            }, function (response) {
                // do something on error
                // todo hide the spinner
                //alert('stop spinner');
                $('#mydiv').hide();
                $('.hidden-content').removeClass('hidden-content');
                return $q.reject(response);
            });
        };
    });

var contentappControllers = angular.module('contentappControllers', ['SharedServices']);

contentApp.directive('carousel', function() {
	var res = {
     restrict : 'A',
     link     : function (scope, element, attrs) {
           scope.$watch(attrs.carousel, function(gists) {  
           	if(scope.gists.length > 0)
           	{
           		gists = scope.gists;
           		var genre = element.attr('data-genre');
           		var html = '';
	            for (var i = 0; i < gists.length; i++) {
	            	if ($.inArray(genre, gists[i].genres) != -1) {
	            	var gistTitleLink = gists[i].poster_image || '/assets/img/posters/' + gists[i].title.replace('/', ' ') + '.jpg';
	                 html += '<div class="item">' +
						          '<div class="thumbnail carousel-gists">' +
						            '<a href="index.html#/gists/' + gists[i].title.replace('/', '%252F') + '"><img alt="100%x180" src="' + gistTitleLink + '"></a>' +
						          '</div>' +
						          '<span><a href="index.html#/gists/' + gists[i].title.replace('/', '%252F') + '">' + gists[i].title + '</a></span>' +
						        '</div>';
						    };
	            }
            
            	element[0].innerHTML = html;

            	setTimeout(function() {
	            $(element).owlCarousel({
						items : 8,
						itemsDesktop : [1199,6],
						itemsDesktopSmall : [980,5],
						itemsTablet: [768,4],
						itemsMobile: [479, 2]
					});

            	$("#owl-example").owlCarousel({
					    items : 3,
					    itemsDesktop : [1199,3],
					    itemsDesktopSmall : [980,3],
					    itemsTablet: [768,2]
					});
	           }, 0);
			}
        	
        });
       }
   };
  return res;
});

contentApp.controller('GistListCtrl', ['$scope', '$http', '$templateCache', 
	function($scope, $http, $templateCache) {
	  	$scope.url = 'http://localhost:3000/api/v0/gists?api_key=special-key&neo4j=false';
	  	$scope.gists = [];

	  	var fetchGists = function()
	  	{
	  		$http({method: 'GET', url: $scope.url, cache: $templateCache}).
			    success(function(data, status, headers, config) {
			    	$scope.gists = data;
			    }).
			    error(function(data, status, headers, config) {
			    // called asynchronously if an error occurs
			    // or server returns response with an error status.
			    });
	  	}

	  	fetchGists();
	}]);


// contentApp.directive('carouselactors', function() {
// 	var res = {
//      restrict : 'A',
//      link     : function (scope, element, attrs) {
//            scope.$watch(attrs.carouselactors, function(gist) {  
//            	if(scope.gist != undefined ? scope.gist.actors != undefined ? scope.gist.actors.length > 0 : false : false)
//            	{
//            		gist = scope.gist;
//            		var html = '';
// 	            for (var i = 0; i < gist.actors.length; i++) {
// 					var actorTitleLink = gist.actors[i].poster_image || '/assets/img/actors/' + gist.actors[i].name.replace('/', ' ') + '.jpg';
// 	                 html += '<div class="item">' +
// 						          '<div class="thumbnail">' +
// 						            '<a href="index.html#/people/' + gist.actors[i].name + '"><img src="' + actorTitleLink + '"/></a>' +
// 						          '</div>' +
// 						          '<span><a href="index.html#/people/' + gist.actors[i].name + '">' + gist.actors[i].name + '</a></span>' +
// 						        '</div>';

// 	            }
//             //src="assets/img/actors/' + actorTitleLink + '.jpg"
//             	element[0].innerHTML = html;

//             	setTimeout(function() {
// 	            $(element).owlCarousel({
// 					items : 7,
// 					itemsDesktop : [1199,6],
// 					itemsDesktopSmall : [980,5],
// 					itemsTablet: [768,5],
// 					itemsMobile: [479, 3]
// 				});
// 				Holder.run();
// 	           }, 0);
// 			}
        	
//         });
//        }
//    };
//   return res;
// });

contentApp.directive('carouselrelatedgists', function() {
	var res = {
     restrict : 'A',
     link     : function (scope, element, attrs) {
           scope.$watch(attrs.carouselrelatedgists, function(gist) {  
           	if(scope.gist != undefined ? scope.gist.related != undefined ? scope.gist.related.length > 0 : false : false)
           	{
           		gist = scope.gist;
           		var html = '';
	            for (var i = 0; i < gist.related.length; i++) {
					var relatedGistTitleLink = gist.related[i].related.poster_image || '/assets/img/posters/' + gist.related[i].related.title.replace('/', ' ') + '.jpg';
	                 html += '<div class="item">' +
						          '<div class="thumbnail">' +
						            '<a href="index.html#/gists/' + gist.related[i].related.title.replace('/', '%252F')  + '"><img src="' + relatedGistTitleLink + '"/></a>' +
						          '</div>' +
						          '<span><a href="index.html#/gists/' + gist.related[i].related.title.replace('/', '%252F')  + '">' + gist.related[i].related.title + '</a></span>' +
						        '</div>';

	            }

            	element[0].innerHTML = html;

            	setTimeout(function() {
	            $(element).owlCarousel({
					items : 7,
					itemsDesktop : [1199,6],
					itemsDesktopSmall : [980,5],
					itemsTablet: [768,5],
					itemsMobile: [479, 3]
				});
				Holder.run();
	           }, 0);
			}
        	
        });
       }
   };
  return res;
});



contentApp.controller('GistItemCtrl', ['$scope', '$routeParams', '$http', '$templateCache',
  function($scope, $routeParams, $http, $templateCache) {
  		console.log('http://localhost:3000/api/v0/gists/title/' + encodeURIComponent(decodeURI(decodeURI($routeParams.gistId))) + '?api_key=special-key&neo4j=false');
  		$scope.url = 'http://localhost:3000/api/v0/gists/title/' + encodeURIComponent(decodeURI(decodeURI($routeParams.gistId))) + '?api_key=special-key&neo4j=false';
	  	var fetchGist = function()
	  	{
	  		$http({method: 'GET', url: $scope.url, cache: $templateCache}).
			    success(function(data, status, headers, config) {
			    	$scope.gist = data;
			    	$scope.gist.poster_image = $scope.gist.poster_image || '/assets/img/posters/' + $scope.gist.title.replace('/', ' ') + '.jpg';
			    	$scope.gist.poster_image = $scope.gist.poster_image.replace("w185", "w300");
			    }).
			    error(function(data, status, headers, config) {
			    // called asynchronously if an error occurs
			    // or server returns response with an error status.
			    });
	  	}

	  	fetchGist();
  }]);

contentApp.directive('carouselpeoplegists', function() {
	var res = {
     restrict : 'A',
     link     : function (scope, element, attrs) {
           scope.$watch(attrs.carouselpeoplegists, function(people) {  
           	console.log(scope.people);
           	if(scope.people != undefined ? scope.people.gists != undefined ? scope.people.gists.length > 0 : false : false)
           	{
           		people = scope.people;
           		var html = '';
	            for (var i = 0; i < people.gists.length; i++) {
	            	var relatedGistTitleLink = people.gists[i].poster_image || '/assets/img/posters/' + people.gists[i].title.replace('/', ' ') + '.jpg';
	                 html += '<div class="item">' +
						          '<div class="thumbnail">' +
						            '<a href="index.html#/gists/' + people.gists[i].title.replace('/', '%252F')  + '"><img src="' + relatedGistTitleLink +'"/></a>' +
						          '</div>' +
						          '<span><a href="index.html#/gists/' + people.gists[i].title.replace('/', '%252F')  + '">' + people.gists[i].title + '</a></span>' +
						        '</div>';

	            }

            	element[0].innerHTML = html;

            	setTimeout(function() {
	            $(element).owlCarousel({
					items : 7,
					itemsDesktop : [1199,6],
					itemsDesktopSmall : [980,5],
					itemsTablet: [768,5],
					itemsMobile: [479, 3]
				});
				Holder.run();
	           }, 0);
			}
        	
        });
       }
   };
  return res;
});

contentApp.directive('carouselrelatedpeople', function() {
	var res = {
     restrict : 'A',
     link     : function (scope, element, attrs) {
           scope.$watch(attrs.carouselrelatedpeople, function(people) {  
           	if(scope.people != undefined ? scope.people.related != undefined ? scope.people.related.length > 0 : false : false)
           	{
           		people = scope.people;
           		var html = '';
	            for (var i = 0; i < people.related.length; i++) {
					var actorTitleLink = people.related[i].related.poster_image || '/assets/img/actors/' + people.related[i].related.name.replace('/', ' ') + '.jpg';
	                 html += '<div class="item">' +
						          '<div class="thumbnail">' +
						            '<a href="index.html#/people/' + people.related[i].related.name + '"><img src="' + actorTitleLink + '"/></a>' +
						          '</div>' +
						          '<span><a href="index.html#/people/' + people.related[i].related.name + '">' + people.related[i].related.name + '</a></span>' +
						        '</div>';

	            }
            //src="assets/img/actors/' + actorTitleLink + '.jpg"
            	element[0].innerHTML = html;

            	setTimeout(function() {
	            $(element).owlCarousel({
					items : 8,
					itemsDesktop : [1199,7],
					itemsDesktopSmall : [980,5],
					itemsTablet: [768,5],
					itemsMobile: [479, 3]
				});
				Holder.run();
	           }, 0);
			}
        	
        });
       }
   };
  return res;
});

contentApp.controller('PeopleItemCtrl', ['$scope', '$routeParams', '$http', '$templateCache',
  function($scope, $routeParams, $http, $templateCache) {
  		console.log('http://localhost:3000/api/v0/people/name/' + encodeURIComponent(decodeURI(decodeURI($routeParams.peopleId))) + '?api_key=special-key&neo4j=false');
  		$scope.url = 'http://localhost:3000/api/v0/people/name/' + encodeURIComponent(decodeURI(decodeURI($routeParams.peopleId))) + '?api_key=special-key&neo4j=false';
	  	var fetchPeople = function()
	  	{
	  		$http({method: 'GET', url: $scope.url, cache: $templateCache}).
			    success(function(data, status, headers, config) {
			    	$scope.people = data;
			    	$scope.people.poster_image = $scope.people.poster_image || '/assets/img/actors/' + $scope.people.name.replace('/', ' ') + '.jpg';
			    }).
			    error(function(data, status, headers, config) {
			    // called asynchronously if an error occurs
			    // or server returns response with an error status.
			    });
	  	}

	  	fetchPeople();
  }]);