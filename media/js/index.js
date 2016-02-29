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

    .controller("LoginCtrl", function ($scope, $window) {
        var _ref = new Firebase("https://happy125.firebaseio.com");

        $scope.loginWithFacebook = function () {
            _ref.authWithOAuthRedirect("facebook", function (error, authData) {
                if (error) {
                    console.log("Login Failed!", error);
                } else {
                    console.log("Authenticated successfully with payload:", authData);
                }
            }, { 'scope': 'email,public_profile' });
        }

        $scope.loginWithEmail = function ($event) {
            var email = $scope.user.email;
            var password = $scope.user.password;

            _ref.authWithPassword({
                email: email,
                password: password
            }, function (error, authData) {
                if (error) {
                    console.log("Error:", error);
                } else {
                    console.table(authData);

                    $scope.$storage.authData = authData;
                }
            });
        }

        $scope.logout = function () {
            _ref.unauth();

            $window.location.reload();
        }
    })

    .controller("RegisterCtrl", function ($scope) {
        var _ref = new Firebase("https://happy125.firebaseio.com");

        $scope.register = function ($event) {
            var email = $scope.user.email;
            var password = $scope.user.password;

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
    })

    .factory("PostSrv", function ($log, $firebaseArray) {
        var _postsRef = new Firebase("https://happy125.firebaseio.com/posts");
        var _posts = $firebaseArray(_postsRef);

        return {
            posts: _posts
        }
    })

    .factory("LikeSrv", function ($log, $firebaseArray) {
        var _ref = new Firebase("https://happy125.firebaseio.com/likes");
        function getSnapshotInfo(snapshot) {
            return {
                key: snapshot.key(),
                values: snapshot.val(),
                count: snapshot.numChildren()
            }
        }

        var _likes = {};
        function setLikeInfo(key, emails) {
            _likes[key] = {
                emails: emails,
                count: emails.length
            };
        }
        
        // value
        _ref.once("value", function (snapshot) {
            var info = getSnapshotInfo(snapshot);
            _.forEach(info.values, function (emails, key) {
                setLikeInfo(key, emails);
            })

            // $log.debug(_likes);
        });
        
        // child_added
        _ref.on("child_added", function (snapshot, prevChildKey) {
            var info = getSnapshotInfo(snapshot);
            setLikeInfo(info.key, info.values);
        });
        
        // child_changed
        _ref.on("child_changed", function (snapshot) {
            var info = getSnapshotInfo(snapshot);
            setLikeInfo(info.key, info.values);
        });
        
        // child_removed
        _ref.on("child_removed", function (snapshot) {
            var info = getSnapshotInfo(snapshot);
            _.pullAll(_likes[info.key], info.values);

            $log.debug("After deletion:", _likes);
        })

        return {
            likes: _likes,
            like: function (post, email) {
                var likes = $firebaseArray(_ref.child(post.$id));
                if (likes.$indexFor(email) === -1) {
                    likes.$add(email);
                }
            },
            unlike: function (post, email) {
                var likes = $firebaseArray(_ref.child(post.$id));
                if (likes.$indexFor(email) !== -1) {
                    likes.$remove(email);
                }
            }
        }
    })

    .factory("AuthSrv", function ($log, $localStorage, $rootScope) {
        // TODO: Auth.$requireAuth();
        
        var _ref = new Firebase("https://happy125.firebaseio.com");
        var _authData = _ref.getAuth();

        return {
            ref: _ref,
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

    .directive('happyPostDirective', function ($log, $firebaseArray, AuthSrv, LikeSrv) {
        return {
            restrict: 'A',
            templateUrl: "templates/happy-post.html",
            replace: true,
            link: function (scope, element, attrs) {
                var post = scope.post;
                
                // Check log-in state
                var isLoggedIn = AuthSrv.isLoggedIn();
                if (isLoggedIn) {
                    var email = AuthSrv.getEmail();
                    
                    // enable & init like button
                    var likeButton = angular.element(element.find('button')[1]);
                    likeButton.removeAttr('disabled')
                    likeButton.on('click', function (event) {
                        LikeSrv.like(post, email);
                    });
                    
                    // enable & init share button
                    var shareButton = angular.element(element.find('button')[2]);
                    shareButton.removeAttr('disabled');
                    shareButton.on('click', function (event) {
                        $log.debug(post.content, "Shared by", email);
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
                        $log.debug('delete:', uid);
                    }
                }  
                
                // perform mdl upgrade
                if (scope.$last === true) {
                    element.ready(function () {
                        componentHandler.upgradeAllRegistered()
                    });
                }
            }
        }
    })
