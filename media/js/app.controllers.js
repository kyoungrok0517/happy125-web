/* global moment */
/* global _ */
/* global Firebase */
angular.module("app.controllers", [])

    .controller("AppCtrl", function ($scope, $log, AuthSrv) {

    })

    .controller("PostCtrl", function ($log, $scope, $rootScope, $firebaseArray, PostSrv, LikeSrv) {
        // Posts
        $scope.posts = PostSrv.posts;
        $scope.posts.$loaded().then(function (posts) {
            // isAuthor
            if ($scope.currentAuth) {
                // isAuthor
                angular.forEach(posts, function (post) {
                    if (post.uid === $rootScope.currentAuth.uid) {
                        post._isAuthor = true;
                    }
                })
                
                // Likes
                var likeObject = LikeSrv.getMyLikeObject($scope.currentAuth.uid);
                likeObject.$loaded().then(function (data) {
                    angular.forEach(data, function (value, key) {
                        $scope.posts.$getRecord(key)._likedByMe = new Boolean(value);
                    })
                }, function (error) { });
            }
        }, function (error) {

        });

        $scope.toggleLike = function (post) {
            if ($rootScope.currentAuth) {
                var _uid = $rootScope.currentAuth.uid;
                if (post._likedByMe) {
                    LikeSrv.unlike(post, _uid);
                    post._likedByMe = false;
                    
                    $log.debug("Unlike");
                } else {
                    LikeSrv.like(post, _uid);
                    post._likedByMe = true;
                    
                    $log.debug("Like");
                }
            }
        }

        $scope.edit = function (post) {
            $log.debug('edit:', post);
        }

        $scope.delete = function (post) {
            PostSrv.remove(post);
        }
    })

    .controller("LoginCtrl", function ($scope, AuthSrv) {
        $scope.loginWithFacebook = AuthSrv.loginWithFacebook;
        $scope.loginWithEmail = AuthSrv.loginWithEmail;
        $scope.logout = AuthSrv.logout;
    })

    .controller("RegisterCtrl", function ($scope, AuthSrv) {
        $scope.register = AuthSrv.registerWithEmail;
    })

    

    
