angular.module('app.routes', [])
    .config(function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("/app");

        $stateProvider
            .state('app', {
                url: '/app',
                abstract: true,
                template: '<ui-view/>',
                controller: function($rootScope, currentAuth) {
                    $rootScope.currentAuth = currentAuth;
                },
                resolve: {
                    "currentAuth": ["AuthSrv", "$log", function (AuthSrv, $log) {
                        return AuthSrv.auth.$waitForAuth();
                    }]
                }
            })
            .state('app.home', {
                url: "/home",
                templateUrl: "partials/home.html"
            })
            .state('app.about', {
                url: "/about",
                templateUrl: "partials/about.html"
            })
    })