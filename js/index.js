var app = angular.module("app", ["firebase"]);

app.controller("PostCtrl", function ($scope, $firebaseArray) {
    var _postsRef = new Firebase("https://happy125.firebaseio.com/posts");
    $scope.posts = $firebaseArray(_postsRef);
    
});