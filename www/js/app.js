angular.module('starter', ['ionic', 'starter.services', 'starter.controllers', 'ngCordova'])

.run(['$ionicPlatform', '$rootScope', 'NetworkService', 'AppRunStatusService', 'NotificationService', function($ionicPlatform, $rootScope, NetworkService, AppRunStatusService, NotificationService) {

  $rootScope.resourcePath = window.RESOURCE_ROOT;

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

.config(['$stateProvider', '$urlRouterProvider', '$ionicConfigProvider', '$translateProvider', function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $translateProvider) {
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js

  $stateProvider

    // setup an abstract state for the app
    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: RESOURCE_ROOT +  'templates/menu.html',
      controller: 'AppCtrl'
    })

    // the project app has its own child nav-view and history
    .state('app.project-index', {
      url: '/projects',
      views: {
        'menuContent': {
          templateUrl: RESOURCE_ROOT + 'templates/projectIndex.html',
          controller: 'ProjectIndexCtrl'
        }
      }
    })

    .state('app.project-detail', {
      url: '/project/:projectId',
      views: {
        'menuContent': {
          templateUrl: RESOURCE_ROOT +  'templates/projectDetail.html',
          controller: 'ProjectDetailCtrl'
        }
      }
    })

    .state('app.project-expense', {
      url: '/project/:type/:projectId',
      views: {
        'menuContent': {
          templateUrl: RESOURCE_ROOT +  'templates/projectTimeExpList.html',
          controller: 'ProjectExpenseCtrl'
        }
      }
    })

    .state('app.project-expense-new', {
      url: '/project/:type/new/:projectId',
      views: {
        'menuContent': {
          templateUrl: RESOURCE_ROOT +  'templates/projectTimeExpNew.html',
          controller: 'ProjectExpNewCtrl'
        }
      }
    })


    /*****************************************************
     * S E T T I N G S    &    D E V    T O O L S
     ****************************************************/

    .state('app.settings', {
      url: '/settings',
      views: {
        'menuContent': {
          templateUrl: RESOURCE_ROOT +  'templates/settings.html',
          controller: 'SettingsCtrl'
        }
      }
    })

    .state('app.settings-devtools', {
      url: '/settings/devtools',
      views: {
        'menuContent': {
          templateUrl: RESOURCE_ROOT +  'templates/settingsDevTools.html',
          controller: 'SettingsCtrl'
        }
      }
    })

    .state('app.settings-mti', {
      url: '/settings/mti',
      views: {
        'menuContent': {
          templateUrl: RESOURCE_ROOT +  'templates/settingsDevMTI.html',
          controller: 'MTICtrl'
        }
      }
    })

    .state('app.mti-detail', {
      url: '/settings/mti/:tableName',
      views: {
        'menuContent': {
          templateUrl: RESOURCE_ROOT +  'templates/settingsDevMTIDetail.html',
          controller: 'MTIDetailCtrl'
        }
      }
    })

    .state('app.settings-testing', {
      url: '/settings/testing',
      views: {
        'menuContent': {
          templateUrl: RESOURCE_ROOT +  'templates/settingsTesting.html',
          controller: 'TestingCtrl'
        }
      }
    })

    .state('app.settings-deploy', {
      url: '/settings/deploy',
      views: {
        'menuContent': {
          templateUrl: RESOURCE_ROOT +  'templates/settingsDeploy.html',
          controller: 'DeployCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/projects');

  // Translations
  $translateProvider.translations('en', {
    'TITLE_PROJECTS': 'Projects',
    'SETTINGS': 'Settings',
    'LOADING': 'Loading...',
    'FETCHING_PROJECTS': 'Fetching Projects...',
    'SYNCING': 'Syncing...',
    'REFRESH_AND_SYNC': 'Refresh and Sync',
    'NO_RECS_TO_SYNC': 'No device records to sync...',
    'SYNC_IN_PROGRESS': 'Sync already in progress...',
    'PLEASE_CONNECT': 'Please connect before syncing',
    'TIMESHEETS': 'Timesheets',
    'EXPENSES': 'Expenses',
    'EXPENSE': 'Expense',
    'NEW_TIMESHEET': 'New Timesheet',
    'NEW_EXPENSE': 'New Expense',
    'NO_RECORDS': 'No Records.',
    'TIME': 'Time',
    'LOCATION': 'Location',
    'SAVE': 'Save',
    'VIEW_TIMESHEETS': 'View Timesheet Records',
    'VIEW_EXPENSES': 'View Expense Records',
    'CURRENCY_SYMBOL': '£',
    'HOURS_ABBREV': 'h',
    'MINUTES_ABBREV': 'm',
    'MINUTES': 'minutes',
    'CANCEL': 'Cancel',
    'SUBMIT': 'Submit',
    'NEW_REC_DESCRIPTION': 'Description',
    'TIMESHEET_DESC': 'Duration in minutes',
    'TIMESHEET_DESC_PLACEHOLDER': 'What did you spend time doing?',
    'EXPENSE_DESC': 'How much was it?',
    'EXPENSE_DESC_PLACEHOLDER': 'What did you spend money on?',
    'MENU_TITLE': 'Menu',
    'BACK': 'Back',
    'SEARCH': 'Search',
    'SAVING': 'Saving...',
    'SAVING_PROJECT': 'Saving project...',
    'SAVING_RECORD': 'Saving record...'
  });
  $translateProvider.translations('he', {
    'TITLE_PROJECTS': 'פרויקטים',
    'SETTINGS': 'הגדרות',
    'LOADING': 'טְעִינָה ...',
    'FETCHING_PROJECTS': 'מקסים פרויקטים ...',
    'SYNCING': 'מסנכרן ...',
    'REFRESH_AND_SYNC': 'רענן וסנכרון',
    'NO_RECS_TO_SYNC': 'לא רשומות מכשיר לסינכרון ...',
    'SYNC_IN_PROGRESS': 'סנכרון כבר בהתקדמות ...',
    'PLEASE_CONNECT': 'אנא להתחבר לפני סינכרון',
    'TIMESHEETS': 'גליונות',
    'EXPENSES': 'הוצאות',
    'EXPENSE': 'חשבון',
    'NEW_TIMESHEET': 'גליון חדש',
    'NEW_EXPENSE': 'הוצאות חדשות',
    'NO_RECORDS': 'אין רשומות.',
    'TIME': 'זמן',
    'LOCATION': 'מיקום',
    'SAVE': 'שמור',
    'VIEW_TIMESHEETS': 'רשומות גליון צפה',
    'VIEW_EXPENSES': 'רשומות תצוגת הוצאות',
    'CURRENCY_SYMBOL': '₪',
    'HOURS_ABBREV': 'שעות',
    'MINUTES_ABBREV': 'דקות',
    'MINUTES': 'דקות',
    'CANCEL': 'לבטל',
    'SUBMIT': 'שלח',
    'NEW_REC_DESCRIPTION': 'תיאור',
    'TIMESHEET_DESC': 'משך בדקות',
    'TIMESHEET_DESC_PLACEHOLDER': 'מה אתה מבזבז את הזמן עושה?',
    'EXPENSE_DESC': 'כמה זה היה?',
    'EXPENSE_DESC_PLACEHOLDER': 'מה עשה לך להוציא כסף על?',
    'MENU_TITLE': 'תפריט',
    'BACK': 'חזור',
    'SEARCH': 'חיפוש',
    'SAVING': 'שמירה ...',
    'SAVING_PROJECT': 'שמירת פרויקט ...',
    'SAVING_RECORD': 'חיסכון שיא ...'
  });

  $translateProvider.preferredLanguage('he');

  // $ionicConfigProvider.backButton.text('חזור');

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