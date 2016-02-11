var app = angular.module('nobody', ['ui.router']); // add ui.router as dependency

app.factory('events', ['$http', 'auth', function($http, auth){
  var e = {
    events: []
  };

  e.getAll = function() {
    return $http.get('/events').success(function(data){
      angular.copy(data, e.events);
    });
  };

  e.create = function(event) {
    return $http.post('/events', event, {
      headers: { Authorization: 'Bearer ' + auth.getToken() }
    }).success(function(data) {
      e.events.push(data);
    });
  };

  e.upvote = function(event) {
    return $http.put('/events/' + event._id + '/upvote', null, {
      headers: { Authorization: 'Bearer ' + auth.getToken() }
    }).success(function(data) {
        event.upvotes += 1;
      });
  };

  e.get = function(id) {
    return $http.get('/events/' + id).then(function(res){
      return res.data;
    });
  };

  e.addComment = function(id, comment) {
    return $http.post('/events/' + id + '/comments', comment, {
      headers: { Authorization: 'Bearer ' + auth.getToken() }
    });
  };

  e.upvoteComment = function(event, comment) {
    return $http.put('/events/' + event._id + '/comments/' + comment._id + '/upvote', null, {
      headers: { Authorization: 'Bearer ' + auth.getToken()}
    }).success(function(data) {
        comment.upvotes += 1;
      });
  };

  e.attend = function(event) {
    return $http.post('/events/' + event._id + '/attend', null, {
      headers: { Authorization: 'Bearer ' + auth.getToken() }
    });
  };

  e.cancel = function(event) {
    return $http.put('/events/' + event._id + '/cancel', null, {
      headers: { Authorization: 'Bearer ' + auth.getToken() }
    });
  };

  e.delete = function(event) {
    return $http.delete('/events/' + event._id, {
      headers: { Authorization: 'Bearer ' + auth.getToken() }
    }).success(function(data){
      e.getAll();
    });
  };

  return e;

}]).factory('auth', ['$http', '$window', function($http, $window){
  var auth = {};

  auth.saveToken = function(token) {
    $window.localStorage['nobody-events-token'] = token;
  };

  auth.getToken = function() {
    return $window.localStorage['nobody-events-token'];
  }

  auth.isLoggedIn = function() {
    var token = auth.getToken();

    if(token) {
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };

  auth.currentUser = function() {
    if(auth.isLoggedIn()) {
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.username;
    }
  };

  auth.userId = function() {
    if(auth.isLoggedIn()) {
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload._id;
    }
  };

  auth.register = function(user) {
    return $http.post('/register', user).success(function(data) {
      auth.saveToken(data.token);
    });
  };

  auth.logIn = function(user) {
    return $http.post('/login', user).success(function(data){
      auth.saveToken(data.token);
    });
  };

  auth.logOut = function(user) {
    $window.localStorage.removeItem('nobody-events-token');
  };

  return auth;
}]);

app.controller('MainCtrl', [
  '$scope',
  'events',
  'auth',
  function($scope, events, auth) {
    $scope.events = events.events;
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser();

    $scope.addEvent = function() {
      if(!$scope.title || $scope.title === '') { return;}

      events.create({
        title: $scope.title,
        location: $('#searchTextField').val()
      });
      $scope.title = '';
      $scope.location = '';
    };

    $scope.removeEvent = function(event) {
      events.delete(event);
    };

    $scope.incrementUpvotes = function(event) {
      events.upvote(event);
    };

    $scope.isYourPost = function(event) {
      return event.author.username === $scope.currentUser;
    };

    var input = document.getElementById('searchTextField');
    var autocomplete = new google.maps.places.Autocomplete(input);

  }])
  .controller('EventsCtrl', [
    '$scope',
    'events',
    'event',
    'auth',
    function($scope, events, event, auth) {
      $scope.event = event;
      $scope.isLoggedIn = auth.isLoggedIn;
      $scope.isAttending = event.attendants.includes(auth.userId());

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

      $scope.addAttendant = function(){
        events.attend(event).success(function(event){
          $scope.event.attendants = event.attendants;
          $scope.isAttending = true;
        });
      };

      $scope.removeAttendant = function(){
        events.cancel(event).success(function(event){
          $scope.event.attendants = event.attendants;
          $scope.isAttending = false;
        });
      };

    }])
  .controller('AuthCtrl', [
    '$scope',
    '$state',
    'auth',
    function($scope, $state, auth) {
      $scope.user = {};

      $scope.register = function() {
        auth.register($scope.user).error(function(error) {
          $scope.error = error;
        }).then(function() {
          $state.go('home');
        });
      }

      $scope.logIn = function() {
        auth.logIn($scope.user).error(function(error){
          $scope.error = error;
        }).then(function(){
          $state.go('home');
          });
      };
    }])
  .controller('NavCtrl', [
    '$scope',
    'auth',
    function($scope, auth) {
      $scope.isLoggedIn = auth.isLoggedIn;
      $scope.currentUser = auth.currentUser;
      $scope.logOut = auth.logOut;
    }]);

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
      })
      .state('users', {
        url: '/users',
        templateUrl: '/users.html',
        controller: 'UsersCtrl'
      })
      .state('login', {
        url: '/login',
        templateUrl: '/login.html',
        controller: 'AuthCtrl',
        onEnter: ['$state', 'auth', function($state, auth) {
          if(auth.isLoggedIn()) {
            $state.go('home');
          }
        }]
      })
      .state('register', {
        url: '/register',
        templateUrl: '/register.html',
        controller: 'AuthCtrl',
        onEnter: ['$state', 'auth', function($state, auth) {
          if(auth.isLoggedIn()) {
            $state.go('home');
          }
        }]
      });

    $urlRouterProvider.otherwise('home');
  }
]);
