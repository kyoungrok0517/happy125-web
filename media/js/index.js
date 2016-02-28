/* global Firebase */
angular.module("app", ["firebase", "ngStorage"])

    .run(function ($rootScope, $localStorage, $sessionStorage, $log) {
        // Setup localStorage
        $rootScope.$storage = $localStorage;

        // Auth
        var ref = new Firebase("https://happy125.firebaseio.com");
        ref.onAuth(function (authData) {
            if (authData) {
                $rootScope.authData = authData;

                $log.debug("Authenticated with:", authData);
            } else {
                $rootScope.authData = null;

                $log.debug("Client unauthenticated.")
            }
        });
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

    .directive('happyPost', function ($log) {
        return {
            restrict: 'A',
            templateUrl: "templates/happy-post.html",
            replace: true,
            controller: function($scope, $element, $attrs, $transclude) {
                // var menus = $element.find('ul');
                // componentHandler.upgradeElements(menus);
            }
            // link: function (scope, element, attrs) {
            //     var menus = element.find('ul');
            //     componentHandler.upgradeElements(menus);
            // }
        }
    })
