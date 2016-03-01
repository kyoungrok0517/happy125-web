/* global moment */
/* global _ */
/* global Firebase */
angular.module("app.controllers", [])

    .controller("AppCtrl", function($scope, $log, AuthSrv) {
        
    })

    .controller("PostCtrl", function ($log, $scope, $firebaseArray, PostSrv) {
        $scope.posts = PostSrv.posts;
    })

    .controller("LoginCtrl", function ($scope, AuthSrv) {
        $scope.loginWithFacebook = AuthSrv.loginWithFacebook;
        $scope.loginWithEmail = AuthSrv.loginWithEmail;
        $scope.logout = AuthSrv.logout;
    })

    .controller("RegisterCtrl", function ($scope, AuthSrv) {
        $scope.register = AuthSrv.registerWithEmail;
    })

    

    
