angular.module('app.core', ["ui.router", "firebase", "ngStorage", 'app.controllers', 'app.services', 'app.directives'])
    .config(function ($logProvider) {
        $logProvider.debugEnabled(true);
    })

    .run(function ($rootScope, $localStorage, $sessionStorage, $log, AuthSrv) {
        // Setup localStorage
        $rootScope.$storage = $localStorage;
    })