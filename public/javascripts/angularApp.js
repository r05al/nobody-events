var app = angular.module('nobody', ['ui.router']); // add ui.router as dependency

app.factory('events', [function(){
  var e = {
    events: []
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
      $scope.events.push({
        title: $scope.title,
        location: $scope.location,
        attendance: 0,
        comments: [
          {author: 'Joe', body: 'Sweet event!', upvotes: 0 },
          {author: 'Bob', body: 'LETS GO!', upvotes: 0 }
        ]
      });
      $scope.title = '';
      $scope.location = '';
    };

    $scope.incrementAttendance = function(event) {
      event.attendance += 1;
    }
  }]
).controller('EventsCtrl', [
  '$scope',
  '$stateParams',
  'events',
  function($scope, $stateParams, events) {
    $scope.event = events.events[$stateParams.id];

    $scope.addComment = function(){
      if($scope.body === '') { return; }
      $scope.event.comments.push({
        body: $scope.body,
        author: 'user',
        upvotes: 0
      });
      $scope.body = '';
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
        controller: 'MainCtrl'
      })
      .state('events', {
        url: '/events/{id}',
        templateUrl: '/events.html',
        controller: 'EventsCtrl'
      });

    $urlRouterProvider.otherwise('home');
  }
]);
