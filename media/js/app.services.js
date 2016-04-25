angular.module('app.services', [])

    .factory('$scrollArray', function ($firebaseArray) {
        return function (ref, field) {
            // create a special scroll ref
            var scrollRef = new Firebase.util.Scroll(ref, field);
            // generate a synchronized array with the ref
            var list = $firebaseArray(scrollRef);
            // store the scroll namespace on the array for easy ref
            list.scroll = scrollRef.scroll;

            return list;
        }
    })

    .factory('TimeSrv', ['$log', function ($log) {
        moment.locale('ko');

        function getCalendar() {
            return moment().calendar();
        }

        function getLongDate(unix) {
            return moment.unix(unix).format("YYYY년 M월 D일");
        }

        function getLongDateWithTime(unix) {
            // 'YYYY년 MMMM D일 A h시 m분',
            // LLLL : 'YYYY년 MMMM D일 dddd A h시 m분'
            return moment.unix(unix).format("YYYY년 M월 D일 A h:mm");
        }

        function getRelative(unix) {
            return moment.unix(unix).fromNow();
        }

        function getDefault() {
            return moment().format();
        }

        return {
            getLongDate: getLongDate,
            getLongDateWithTime: getLongDateWithTime,
            getRelative: getRelative,
            getCalendar: getCalendar,
            getDefault: getDefault
        }
    }])

    .factory("ListWithTotal", ["$firebaseArray",
        function ($firebaseArray) {
            // create a new service based on $firebaseArray
            var ListWithTotal = $firebaseArray.$extend({
                getTotal: function () {
                    var total = 0;
                    // the array data is located in this.$list
                    angular.forEach(this.$list, function (rec) {
                        total += rec.amount;
                    });
                    return total;
                }
            });
            return function (listRef) {
                // create an instance of ListWithTotal (the new operator is required)
                return new ListWithTotal(listRef);
            }
        }
    ])

    .factory("$postArray", ["$log", "$firebaseArray", "$rootScope", "TimeSrv",
        function ($log, $firebaseArray, $rootScope, TimeSrv) {
            var $postArray = $firebaseArray.$extend({
                $$added: function (snapshot, prevChildKey) {
                    var post = snapshot.val();

                    // set `$id`
                    post.$id = snapshot.key();

                    // set `ago`
                    post._ago = TimeSrv.getRelative(post.shared_at);

                    // set `isAuthor`
                    var currentAuth = $rootScope.currentAuth;
                    if (currentAuth && post.uid === currentAuth.uid) {
                        post._isAuthor = true;
                    }

                    return post;
                },
                busy: false,
                done: false
            });

            return function (listRef) {
                return new $postArray(listRef);
            }
        }
    ])

    .factory("PostSrv", function ($log, $rootScope, $postArray, LikeSrv, TimeSrv) {
        var baseRef = new Firebase("https://happy125.firebaseio.com/posts");
        var scrollRef = new Firebase.util.Scroll(baseRef, '$priority');
        var _posts = $postArray(scrollRef);
        _posts.scroll = scrollRef.scroll;
        scrollRef.on('value', function (snap) {
            $log.debug('posts loaded');
            _posts.busy = false;
        });

        // Load and apply my `likes`
        var myLikeObj = LikeSrv.myLikeObj;
        myLikeObj.$loaded().then(function () {
            return _posts.$loaded();
        }).then(function () {
            var _p = null;
            angular.forEach(myLikeObj, function(value, key) {
                _p = _posts.$getRecord(key);
                if (_p) {
                    _p._likedByMe = new Boolean(value);
                }
            });
        });

        function getPriority(post) {
            return -moment(post.id).unix();
        }
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
                var deletedPost = angular.copy(post);
                _posts.$remove(post).then(function (rs) {
                    $log.debug("Remove Post:", rs);
                    LikeSrv.removeLike(deletedPost, $rootScope.currentAuth.uid);
                }, function (error) {
                    $log.error(error);
                });
            }
        }
    })


    .factory("LikeSrv", function ($log, $firebaseArray, $firebaseObject, $rootScope, AuthSrv) {
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
            removeLike(post, uid);
            downlike(post);
        }

        function removeLike(post, uid) {
            var path = getLikePath(post, uid);
            likeRef.child(path).remove();
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

        // get my like object
        var myLikeObj = null;
        var myAuth = AuthSrv.getAuth();
        if (myAuth) {
            myLikeObj = $firebaseObject(likeRef.child(myAuth.uid));
        }

        return {
            myLikeObj: myLikeObj,
            like: like,
            unlike: unlike,
            removeLike: removeLike
        };
    })

    .factory("AuthSrv", function ($log, $localStorage, $rootScope, $window, $firebaseAuth) {
        var _ref = new Firebase("https://happy125.firebaseio.com");
        var _authObject = $firebaseAuth(_ref);
        var _currentAuth = $rootScope.currentAuth;

        function loginWithFacebook() {
            _ref.authWithOAuthRedirect("facebook", function (error, authData) {
                if (error) {
                    $log.error("Login Failed!", error);
                } else {
                    $log.debug("Authenticated successfully with payload:", authData);
                }
            }, { 'scope': 'email,public_profile' });
        }

        function loginWithEmail(email, password) {
            _ref.authWithPassword({
                email: email,
                password: password
            }, function (error, authData) {
                if (error) {
                    $log.error("Error:", error);
                } else {
                    $log.debug(authData);
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
                    $log.error("Error:", error);
                } else {
                    $log.debug(userData);
                }
            });
        }

        return {
            authRef: _ref,
            authObject: _authObject,
            loginWithFacebook: loginWithFacebook,
            loginWithEmail: loginWithEmail,
            logout: logout,
            registerWithEmail: registerWithEmail,
            getAuth: function () {
                return _ref.getAuth();
            },
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