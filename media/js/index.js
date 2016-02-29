/* global Firebase */
angular.module("app", ["firebase", "ngStorage"])

    .run(function ($rootScope, $localStorage, $sessionStorage, $log, AuthSrv) {
        // Setup localStorage
        $rootScope.$storage = $localStorage;
        
        // Auth
        $rootScope.authSrv = AuthSrv;
        // $log.debug(AuthSrv.getEmail());
    })

    .factory("AuthSrv", function ($log, $localStorage, $rootScope) {
        var _ref = new Firebase("https://happy125.firebaseio.com");
        var _authData = {};
        _ref.onAuth(function (authData) {
            if (authData) {
                _authData = authData;
                $rootScope.isLoggedIn = true;
                $log.debug("Authenticated with:", authData);
            } else {
                _authData = null;
                $rootScope.isLoggedIn = false;
                $log.debug("Client unauthenticated.")
            }
        });

        return {
            ref: _ref,
            authData: _authData,
            isLoggedIn: function () {
              return this.authData;  
            },
            getUid: function () {
                if (this.authData) {
                    return this.authData.uid || null;
                } else {
                    return null;
                }
            },
            getEmail: function() {
                var authData = this.authData;
                if (authData) {
                    var provider = authData.provider;
                    if (provider === 'facebook') {
                        return authData.facebook.email;
                    } else if (provider === 'email') {
                        return authData.email.email;
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            },
            isAuthor: function(email) {
                return this.getEmail() === email;
            }
        }
    })

    .controller("PostCtrl", function ($scope, $firebaseArray) {
        var _postsRef = new Firebase("https://happy125.firebaseio.com/posts");
        $scope.posts = $firebaseArray(_postsRef);
    })

    .controller("LoginCtrl", function ($scope) {
        var _ref = new Firebase("https://happy125.firebaseio.com");

        $scope.loginWithFacebook = function () {
            _ref.authWithOAuthRedirect("facebook", function (error, authData) {
                if (error) {
                    console.log("Login Failed!", error);
                } else {
                    console.log("Authenticated successfully with payload:", authData);
                }
            }, { 'scope': 'email,public_profile' });
        }

        $scope.loginWithEmail = function ($event) {
            var email = $scope.user.email;
            var password = $scope.user.password;

            _ref.authWithPassword({
                email: email,
                password: password
            }, function (error, authData) {
                if (error) {
                    console.log("Error:", error);
                } else {
                    console.table(authData);

                    $scope.$storage.authData = authData;
                }
            });
        }

        $scope.logout = function () {
            _ref.unauth();
        }
    })

    .controller("RegisterCtrl", function ($scope) {
        var _ref = new Firebase("https://happy125.firebaseio.com");

        $scope.register = function ($event) {
            var email = $scope.user.email;
            var password = $scope.user.password;

            _ref.createUser({
                email: email,
                password: password
            }, function (error, userData) {
                if (error) {
                    console.log("Error:", error);
                } else {
                    console.table(userData);
                }
            });
        }
    })

    .directive('happyPostDirective', function ($log, AuthSrv) {
        return {
            restrict: 'A',
            templateUrl: "templates/happy-post.html",
            replace: true,
            link: function (scope, element, attrs) {
                // enable or disable edit menu 
                // depending on the authorship
                var isAuthor = AuthSrv.isAuthor(scope.post.email);
                if (isAuthor) {
                    
                } 
                
                // perform mdl upgrade
                if (scope.$last === true) {
                    element.ready(function () {
                        componentHandler.upgradeAllRegistered()
                    });
                }
            }
        }
    })
