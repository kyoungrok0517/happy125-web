angular.module("app", ["firebase"])

    .controller("PostCtrl", function ($scope, $firebaseArray) {
        var _postsRef = new Firebase("https://happy125.firebaseio.com/posts");
        $scope.posts = $firebaseArray(_postsRef);
    })

    .controller("LoginCtrl", function ($scope) {
        var _ref = new Firebase("https://happy125.firebaseio.com");

        $scope.login = function ($event) {
            console.log($event);
            
            // _ref.authWithPassword({
            //     email: email,
            //     password: password
            // }, function(error, authData) {
            //     if (error) {
            //         console.log("Error:", error);
            //     } else {
            //         console.table(authData)
            //     }
            // });
        }
    })

    .directive('dynamicMoreButtonDirective', function () {
        return function (scope, element, attrs) {
            // componentHandler.upgradeElement(element[0]);
            
            // console.log(element[0]);
        };
    })

