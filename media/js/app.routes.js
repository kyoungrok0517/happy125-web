angular.module('app.routes', [])
    .config(function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("/app");

        $stateProvider
            .state('app', {
                url: '/app',
                template: '<ui-view/>',
                controller: function ($rootScope, $log, currentAuth, AuthSrv) {
                    $rootScope.currentAuth = currentAuth;
                    $log.debug(currentAuth);
                },
                resolve: {
                    "currentAuth": ["AuthSrv", function (AuthSrv) {
                        return AuthSrv.authObject.$waitForAuth();
                    }]
                }
            })
            // .state('app.home', {
            //     url: "/home",
            //     templateUrl: "partials/home.html"
            // })
            // .state('app.about', {
            //     url: "/about",
            //     templateUrl: "partials/about.html"
            // })
    })