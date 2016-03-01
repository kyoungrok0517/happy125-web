/* global moment */
/* global _ */
/* global Firebase */
angular.module("app", ["firebase", "ngStorage"])

    .run(function ($rootScope, $localStorage, $sessionStorage, $log, AuthSrv) {
        // Setup localStorage
        $rootScope.$storage = $localStorage;
        
        // Log-in state
        $rootScope.isLoggedIn = AuthSrv.isLoggedIn();
    })

    .controller("PostCtrl", function ($log, $scope, $firebaseArray, AuthSrv, PostSrv) {
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

    .factory("PostSrv", function ($log, $firebaseArray) {
        var _postsRef = new Firebase("https://happy125.firebaseio.com/posts");
        var _posts = $firebaseArray(_postsRef.orderByPriority());

        function getPriority(post) {
            return -moment(post.id).unix();
        }

        // Like object 가져오기
        // _posts.$loaded().then(function () {
        //     if (AuthSrv.isLoggedIn()) {
        //         var uid = AuthSrv.getUid();
        //         var likeObj = getMyLikeObject(uid);
        //         likeObj.$loaded().then(function () {
        //             angular.forEach(likeObj, function (value, key) {
        //                 PostSrv._posts.$getRecord(key)._likedByMe = new Boolean(value);
        //             })
        //         });
        //     }
        // });

        // Production 코드에선 삭제
        // _postsRef.on("value", function (snapshot) {
        //     snapshot.forEach(function (childSnapshot) {
        //         var priority = getPriority(childSnapshot.val());
        //         childSnapshot.ref().setPriority(priority);
        //     });

            
            
        //     // componentHandler.upgradeAllRegistered();
        // });

        return {
            posts: _posts,
            add: function (post) {
                post.$priority = getPriority(post);
                _posts.$add(post).then(function (rs) {
                    $log.debug("Add Post:", rs);
                }, function (error) {
                    $log.error(error);
                });
            },
            remove: function (post) {
                _posts.$remove(post).then(function (rs) {
                    $log.debug("Remove Post:", rs);
                }, function (error) {
                    $log.error(error);
                });
            }
        }
    })

    .factory("LikeSrv", function ($log, $firebaseArray, $firebaseObject, $rootScope) {
        var likeUrl = "https://happy125.firebaseio.com/likes",
            likeRef = new Firebase(likeUrl),
            postUrl = "https://happy125.firebaseio.com/posts",
            postRef = new Firebase(postUrl);

        // functions
        function like(post, uid) {
            var path = getLikePath(post, uid);
            if (!this.isLiked(post, uid)) {
                likeRef.child(path).set(true);
                uplike(post);
            }

            $log.debug("Liked");
        }

        function unlike(post, uid) {
            var path = getLikePath(post, uid);
            if (this.isLiked(post, uid)) {
                likeRef.child(path).remove();
                downlike(post);
            }

            $log.debug("Unliked");
        }

        function uplike(post) {
            var path = getLikeCountPath(post);
            var countRef = new Firebase(path);
            countRef.transaction(function (current_value) {
                return (current_value || 0) + 1;
            });
        }

        function downlike(post) {
            var path = getLikeCountPath(post);
            var countRef = new Firebase(path);
            countRef.transaction(function (current_value) {
                var _current_value = current_value || 0;
                if (_current_value <= 0) {
                    return 0;
                } else {
                    return _current_value - 1;
                }
            });
        }

        function getLikePath(post, uid) {
            return uid + "/" + post.$id;
        }

        function getLikeCountPath(post) {
            return postUrl + "/" + post.$id + "/likes";
        }

        function getMyLikeObject(uid) {
            return $firebaseObject(likeRef.child(uid));
        }

        return {
            like: like,
            unlike: unlike,
            getMyLikeObject: getMyLikeObject
        };
    })

    .factory("AuthSrv", function ($log, $localStorage, $rootScope, $window, $firebaseAuth) {
        // TODO: Auth.$requireAuth();
        
        var _ref = new Firebase("https://happy125.firebaseio.com");
        var _authData = _ref.getAuth();

        function loginWithFacebook() {
            _ref.authWithOAuthRedirect("facebook", function (error, authData) {
                if (error) {
                    console.log("Login Failed!", error);
                } else {
                    console.log("Authenticated successfully with payload:", authData);
                }
            }, { 'scope': 'email,public_profile' });
        }

        function loginWithEmail(email, password) {
            _ref.authWithPassword({
                email: email,
                password: password
            }, function (error, authData) {
                if (error) {
                    console.log("Error:", error);
                } else {
                    console.table(authData);
                }
            });
        }

        function logout() {
            _ref.unauth();
            $window.location.reload();
        }

        function registerWithEmail(email, password) {
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

        return {
            loginWithFacebook: loginWithFacebook,
            loginWithEmail: loginWithEmail,
            logout: logout,
            registerWithEmail: registerWithEmail,
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
            getEmail: function () {
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
            isAuthor: function (email) {
                return this.getEmail() === email;
            }
        }
    })

    .directive('writeFormDirective', function ($log, AuthSrv, PostSrv) {
        return {
            restrict: 'A',
            templateUrl: "templates/write.html",
            replace: true,
            link: function (scope, element, attrs) {
                var isLoggedIn = AuthSrv.isLoggedIn();
                if (isLoggedIn) {
                    element.removeClass('ng-hide');
                }

                scope.write = function () {
                    if (AuthSrv.isLoggedIn()) {
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

    .directive('postDirective', function ($log, $firebaseArray, AuthSrv, LikeSrv, PostSrv) {
        return {
            restrict: 'A',
            templateUrl: "templates/post.html",
            replace: true,
            link: function (scope, element, attrs) {
                var post = scope.post;
                
                // Check log-in state
                var isLoggedIn = AuthSrv.isLoggedIn();
                if (isLoggedIn) {
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
                var isAuthor = AuthSrv.isAuthor(post.email);
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
