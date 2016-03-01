angular.module('app.services', [])

    .factory("PostSrv", function ($log, $rootScope, $firebaseArray, LikeSrv) {
        var _postsRef = new Firebase("https://happy125.firebaseio.com/posts");
        var _posts = $firebaseArray(_postsRef.orderByPriority());
        function getPriority(post) {
            return -moment(post.id).unix();
        }

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
            likeRef.child(path).set(true);
            uplike(post);
        }

        function unlike(post, uid) {
            var path = getLikePath(post, uid);
            likeRef.child(path).remove();
            downlike(post);
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
        var _ref = new Firebase("https://happy125.firebaseio.com");
        var _authObject = $firebaseAuth(_ref);
        var _currentAuth = $rootScope.currentAuth;

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
            authObject: _authObject,
            loginWithFacebook: loginWithFacebook,
            loginWithEmail: loginWithEmail,
            logout: logout,
            registerWithEmail: registerWithEmail,
            getUid: function () {
                if (_currentAuth) {
                    return _currentAuth.uid || null;
                } else {
                    return null;
                }
            },
            getEmail: function () {
                if (_currentAuth) {
                    var provider = _currentAuth.provider;
                    if (provider === 'facebook') {
                        return _currentAuth.facebook.email;
                    } else if (provider === 'email') {
                        return _currentAuth.email.email;
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            },
            isAuthor: function (post) {
                return this.getEmail() === post.email;
            }
        }
    })