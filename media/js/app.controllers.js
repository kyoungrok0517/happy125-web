/* global moment */
/* global _ */
/* global Firebase */
angular.module("app.controllers", [])

    .controller("AppCtrl", function ($scope, $log, AuthSrv) {
        $scope.loadMorePosts = function loadMorePosts() {
            $log.info('loadMorePosts()');
        }

        // set infinite-scroll throttling
        angular.module('infinite-scroll').value('THROTTLE_MILLISECONDS', 250)
    })

    .controller("PostCtrl", function ($log, $scope, $rootScope, $firebaseArray, PostSrv, LikeSrv) {
        // Posts
        $scope.posts = PostSrv.posts;

        // Infite Scroll
        // create a connection to Firebase
        // var baseRef = new Firebase('https://webapi.firebaseio.com/rolodex');
        // // create a scrollable reference
        // var scrollRef = new Firebase.util.Scroll(baseRef, 'name');

        // // create a synchronized array on scope
        // $scope.items = $firebaseArray(scrollRef);
        // // load the first three contacts
        // scrollRef.scroll.next(3);

        // // This function is called whenever the user reaches the bottom
        // $scope.loadMore = function () {
        //     // load the next contact
        //     scrollRef.scroll.next(1);
        //     $scope.$broadcast('scroll.infiniteScrollComplete');
        // };

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




