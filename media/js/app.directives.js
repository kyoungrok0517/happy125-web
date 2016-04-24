angular.module('app.directives', [])

    .directive('writeFormDirective', function ($log, $rootScope, AuthSrv, PostSrv) {
        return {
            restrict: 'A',
            templateUrl: "templates/write.html",
            replace: true,
            link: function (scope, element, attrs) {
                scope.write = function () {
                    if ($rootScope.currentAuth) {
                        var post = scope.post;
                        post.email = $rootScope.currentAuth.facebook.email;
                        post.uid = $rootScope.currentAuth.uid;
                        post.likes = 0;
                        post.author = $rootScope.currentAuth.facebook.displayName;
                        
                        var now = moment();
                        post.id = now.toJSON();
                        post.shared_at = now.unix().toString();                        

                        PostSrv.add(post);
                    } else {
                        $log.error("새로운 글 작성은 로그인 상태에서만 가능합니다.");
                    }
                    
                    // reset the post
                    scope.post = {};
                }
            }
        }
    })

    .directive('postDirective', function ($log, $rootScope) {
        return {
            restrict: 'A',
            templateUrl: "templates/post.html",
            replace: true,
            scope: false,
            link: function (scope, element, attrs) {                
                // perform mdl upgrade on first & last
                // if (scope.$last || scope.$first) {
                    element.ready(function () {
                        componentHandler.upgradeAllRegistered()
                    });
                // }
            }
        }
    })