angular.module('starter', ['ionic', 'ngIOS9UIWebViewPatch', 'starter.services', 'starter.controllers', 'ngCordova'])

.run(['$ionicPlatform', '$rootScope', 'NetworkService', 'AppRunStatusService', 'NotificationService', function($ionicPlatform, $rootScope, NetworkService, AppRunStatusService, NotificationService) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }

    // Local Notification plugin
    if (cordova && cordova.plugins && cordova.plugins.notification) {
      if(device.platform === "iOS") {
         window.plugin.notification.local.promptForPermission();
      }
      cordova.plugins.notification.local.on("trigger", function (notification, state) {
        NotificationService.handleLocalNotification(notification.id, state);
      });
      cordova.plugins.notification.local.on("click", function (notification, state) {
        NotificationService.handleLocalNotificationClick(notification.id, state);
      });
    }

    document.addEventListener("resume", function() {
      AppRunStatusService.statusEvent('resume');
    }, false);
    document.addEventListener("online", function() {
      NetworkService.networkEvent('online');
    }, false);
    document.addEventListener("offline", function() {
      NetworkService.networkEvent('offline');
    }, false);

    // Example of locking the screen orientation to landscape
    // if (screen && screen.lockOrientation) {
    //   screen.lockOrientation('landscape');
    // }
  });

  // handle refresh of project time/expense totals after new time/expense added
  $rootScope.$on('refreshProjectTotals', function(event, args) {
      $rootScope.$broadcast('handleRefreshProjectTotals');
  });
  // handle feedback from syncing of mobile tables
  $rootScope.$on('syncTables', function(event, args) {
      $rootScope.$broadcast('handleSyncTables', args);
  });
}])

.config(['$stateProvider', '$urlRouterProvider', '$ionicConfigProvider', function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js

  $ionicConfigProvider.tabs.position('bottom');

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
          templateUrl: RESOURCE_ROOT +  'templates/projectDetail.html',
          controller: 'ProjectDetailCtrl'
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
          templateUrl: RESOURCE_ROOT +  'templates/projectTimeExpNew.html'
        }
      }
    })


    /*****************************************************
     * S E T T I N G S    &    D E V    T O O L S
     ****************************************************/

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
    })

    .state('tab.settings-deploy', {
      url: '/settings/deploy',
      views: {
        'settings-tab': {
          templateUrl: RESOURCE_ROOT +  'templates/settingsDeploy.html',
          controller: 'DeployCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/projects');

}]);

// This is the function that get's called once the MobileCaddy libs are done
// checking the app install/health. Basically the point at which our client
// app can kick off. It's here we boot angular into action.
function myapp_callback(runUpInfo) {
  if (typeof(runUpInfo) != "undefined" &&
     (typeof(runUpInfo.newVsn) != "undefined" && runUpInfo.newVsn != runUpInfo.curVsn)) {
    // Going to call a hardReset as an upgrade is available.
    //console.debug('runUpInfo', runUpInfo);
    var vsnUtils = mobileCaddy.require('mobileCaddy/vsnUtils');
    vsnUtils.hardReset();
  } else {
    // carry on, nothing to see here
    angular.bootstrap(document, ['starter']);
  }
}