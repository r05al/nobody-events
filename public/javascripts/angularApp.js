var app = angular.module('nobody', ['ui.router']); // add ui.router as dependency

app.factory('events', ['$http', function($http){
  var e = {
    events: []
  };

  e.getAll = function() {
    return $http.get('/events').success(function(data){
      angular.copy(data, e.events);
    });
  };

  e.create = function(event) {
    return $http.post('/events', event).success(function(data){
      e.events.push(data);
    });
  };

  e.upvote = function(event) {
    return $http.put('/events/' + event._id + '/upvote')
      .success(function(data){
        event.upvotes += 1;
      });
  };

  e.get = function(id) {
    return $http.get('/events/' + id).then(function(res){
      return res.data;
    });
  };

  e.addComment = function(id, comment) {
    return $http.post('/events/' + id + '/comments', comment);
  };

  e.upvoteComment = function(event, comment) {
    return $http.put('/events/' + event._id + '/comments/' + comment._id + '/upvote')
      .success(function(data){
        comment.upvotes += 1;
      });
  };

  return e;

}]);

app.controller('MainCtrl', [
  '$scope',
  'events',
  function($scope, events) {
    $scope.events = events.events;

    $scope.addEvent = function() {
      if(!$scope.title || $scope.title === '') { return;}
      events.create({
        title: $scope.title,
        location: $scope.location,
      });
      $scope.title = '';
      $scope.location = '';
    };

    $scope.incrementUpvotes = function(event) {
      events.upvote(event);
    };
  }]
).controller('EventsCtrl', [
  '$scope',
  'events',
  'event',
  function($scope, events, event) {
    $scope.event = event;

    $scope.addComment = function(){
      if($scope.body === '') { return; }
      events.addComment(event._id, {
        body: $scope.body,
        author: 'user',
      }).success(function(comment) {
        $scope.event.comments.push(comment);
      });
      $scope.body = '';
    };

    $scope.incrementUpvotes = function(comment){
      events.upvoteComment(event, comment);
    };

  }
]);

app.config([
  '$stateProvider',
  '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/home',
        templateUrl: '/home.html',
        controller: 'MainCtrl',
        resolve: {
          eventPromise: ['events', function(events){
            return events.getAll();
          }]
        }
      })
      .state('events', {
        url: '/events/{id}',
        templateUrl: '/events.html',
        controller: 'EventsCtrl',
        resolve: {
          event: ['$stateParams', 'events', function($stateParams, events) {
            return events.get($stateParams.id);
          }]
        }
      });

    $urlRouterProvider.otherwise('home');
  }
]);
