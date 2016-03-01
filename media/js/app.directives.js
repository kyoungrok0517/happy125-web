angular.module('app.directives', [])

    .directive('writeFormDirective', function ($log, $rootScope, AuthSrv, PostSrv) {
        return {
            restrict: 'A',
            templateUrl: "templates/write.html",
            replace: true,
            link: function (scope, element, attrs) {
                var currentAuth = $rootScope.currentAuth;
                if (currentAuth) {
                    element.removeClass('ng-hide');
                }

                scope.write = function () {
                    if (currentAuth) {
                        var post = scope.post;
                        post.email = AuthSrv.getEmail();
                        post.uid = AuthSrv.getUid();
                        var now = moment().toJSON();
                        post.id = now;
                        post.shared_at = now;
                        post.likes = 0;

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

    .directive('postDirective', function ($log, $rootScope, AuthSrv, LikeSrv, PostSrv) {
        return {
            restrict: 'A',
            templateUrl: "templates/post.html",
            replace: true,
            link: function (scope, element, attrs) {
                var post = scope.post;
                
                // Check log-in state
                var currentAuth = $rootScope.currentAuth;
                if (currentAuth) {
                    var uid = AuthSrv.getUid();
                    
                    // enable & init like button
                    var likeButton = angular.element(element.find('button')[1]);
                    likeButton.removeAttr('disabled')
                    // var isLiked = LikeSrv.isLiked(post, uid);
                    var likedByMe = post._likedByMe;
                    if (likedByMe) {
                        likeButton.addClass('mdl-color-text--pink');
                    }
                    likeButton.on('click', function (event) {
                        if (likedByMe) {
                            LikeSrv.unlike(post, uid);
                            likeButton.removeClass('mdl-color-text--pink');
                        } else {
                            LikeSrv.like(post, uid);
                            likeButton.addClass('mdl-color-text--pink');
                        }
                    });
                    
                    // enable & init share button
                    var shareButton = angular.element(element.find('button')[2]);
                    shareButton.removeAttr('disabled');
                    shareButton.on('click', function (event) {
                        $log.debug(post.content, "Shared by", uid);
                    });
                }     
                
                // enable or disable edit menu 
                // depending on the authorship
                var isAuthor = AuthSrv.isAuthor(post);
                if (isAuthor) {
                    var editButton = angular.element(element.find('button')[0]);
                    editButton.removeClass('ng-hide');

                    scope.edit = function (uid) {
                        $log.debug('edit:', uid);
                    }

                    scope.delete = function (uid) {
                        PostSrv.remove(post);
                    }
                }  
                
                // perform mdl upgrade on first & last
                if (scope.$last || scope.$first) {
                    element.ready(function () {
                        componentHandler.upgradeAllRegistered()
                    });
                }
            }
        }
    })