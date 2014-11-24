
angular.module('starter', ['ionic', 'starter.services', 'starter.controllers'])


.config(function($stateProvider, $urlRouterProvider) {
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    // setup an abstract state for the tabs directive
    .state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: RESOURCE_ROOT +  'templates/tabsMain.html'
    })

    // the project tab has its own child nav-view and history
    .state('tab.project-index', {
      url: '/projects',
      views: {
        'projects-tab': {
          templateUrl: RESOURCE_ROOT + 'templates/projectIndex.html',
          controller: 'ProjectIndexCtrl'
        }
      }
    })

    .state('tab.project-detail', {
      url: '/project/:projectId',
      views: {
        'projects-tab': {
          templateUrl: RESOURCE_ROOT +  'templates/projectDetail.html'
        }
      }
    })

    .state('tab.project-expense', {
      url: '/project/:type/:projectId',
      views: {
        'projects-tab': {
          templateUrl: RESOURCE_ROOT +  'templates/projectTimeExpList.html',
          controller: 'ProjectExpenseCtrl'
        }
      }
    })

    .state('tab.project-expense-new', {
      url: '/project/:type/new/:projectId',
      views: {
        'projects-tab': {
          templateUrl: RESOURCE_ROOT +  'templates/projectTimeExpNew.html',
          controller: 'ProjectExpNewCtrl'
        }
      }
    })


    /** ***************************************************
     * S E T T I N G S    &    D E V    T O O L S
     *************************************************** */

    .state('tab.settings', {
      url: '/settings',
      views: {
        'settings-tab': {
          templateUrl: RESOURCE_ROOT +  'templates/settings.html',
          controller: 'SettingsCtrl'
        }
      }
    })

    .state('tab.settings-devtools', {
      url: '/settings/devtools',
      views: {
        'settings-tab': {
          templateUrl: RESOURCE_ROOT +  'templates/settingsDevTools.html',
          controller: 'SettingsCtrl'
        }
      }
    })

    .state('tab.settings-mti', {
      url: '/settings/mti',
      views: {
        'settings-tab': {
          templateUrl: RESOURCE_ROOT +  'templates/settingsDevMTI.html',
          controller: 'MTICtrl'
        }
      }
    })

    .state('tab.mti-detail', {
      url: '/settings/mti/:tableName',
      views: {
        'settings-tab': {
          templateUrl: RESOURCE_ROOT +  'templates/settingsDevMTIDetail.html',
          controller: 'MTIDetailCtrl'
        }
      }
    })

    .state('tab.settings-testing', {
      url: '/settings/testing',
      views: {
        'settings-tab': {
          templateUrl: RESOURCE_ROOT +  'templates/settingsTesting.html',
          controller: 'TestingCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/projects');

});

function myapp_callback() {
  angular.bootstrap(document, ['starter']);
}