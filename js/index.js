angular.module("app", ["firebase"])

    .controller("PostCtrl", function ($scope, $firebaseArray) {
        var _postsRef = new Firebase("https://happy125.firebaseio.com/posts");
        $scope.posts = $firebaseArray(_postsRef);
    })

    .directive('dynamicMoreButtonDirective', function () {
        return function (scope, element, attrs) {
            // componentHandler.upgradeElement(element[0]);
            
            // console.log(element[0]);
        };
    })

