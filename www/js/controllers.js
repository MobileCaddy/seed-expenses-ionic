angular.module('starter.controllers', ['ionic', 'ngCordova'])

/*
===========================================================================
  ProjectIndexCtrl
===========================================================================
*/
.controller('ProjectIndexCtrl', ['$scope', '$rootScope', '$ionicLoading', '$interval', '$timeout', 'ProjectService', 'SyncService', 'devUtils', 'logger', function($scope, $rootScope, $ionicLoading, $interval, $timeout, ProjectService, SyncService, devUtils, logger) {

  // By default, 'ion-view's are cached - so this code will only run once.
  // Use 'cache-view="false"' in the view if you want the controller code to run every time.
  // projectIndex.html doesn't use it, whereas projectDetail.html does.

  // This unhides the nav-bar. The navbar is hidden in the cases where we want a
  // splash screen, such as in this app
  e = document.getElementById('my-nav-bar');
  angular.element(e).removeClass( "mc-hide" );

  // Set height of list scrollable area
  var winHeight = window.innerHeight - 125;
  var projectsList = document.getElementById('project-list');
  projectsList.setAttribute("style","height:" + winHeight + "px");

  // Get reference to refresh/sync button (so we can change text, disable etc)
  var storesSyncButton = document.getElementById('projects-sync-button');

  // Adjust width of list refresh/sync button (cater for multiple buttons on different pages)
  var syncButtons = document.getElementsByClassName('sync-button');
  // If you need adjust the width of the refresh/sync button on the list then uncomment and amend following code.
  // Currently, the css on the button will set the width to 100%.
  /*  for (var i = syncButtons.length - 1; i >= 0; --i) {
    syncButtons[i].setAttribute("style","width:" + projectsList.offsetWidth + "px");
  }*/

  // Setup the loader and starting templates
  if (typeof($rootScope.child) == "undefined") {
    $ionicLoading.show({
      duration: 30000,
      delay : 400,
      maxWidth: 600,
      noBackdrop: true,
      template: '<h1>Loading...</h1><p id="app-progress-msg" class="item-icon-left">Fetching Projects...<ion-spinner/></p>'
    });
  }

  var localProjCB = function(localProjects) {
    $rootScope.projects = localProjects;
    if (localProjects.length > 0) $ionicLoading.hide();
  };

  ProjectService.all($rootScope.refreshFlag, localProjCB).then(function(projects) {
    $rootScope.projects = projects;
    //console.log('ProjectIndexCtrl, got projects');
    $ionicLoading.hide();
    SyncButtonsClass("Remove", "ng-hide");
  }, function(reason) {
    logger.error("ProjectService.all " + JSON.stringify(reason));
    //console.log('promise returned reason -> ' + reason);
  });
  $rootScope.refreshFlag = false;

  $scope.doRefreshFromPulldown = function() {
  	//console.log('doRefreshFromPulldown');
  	ProjectService.all(true).then(function(projects) {
      $rootScope.projects = projects;
    }, function(reason) {
      logger.error("doRefreshFromPulldown ProjectService.all " + JSON.stringify(reason));
      //console.log('promise returned reason -> ' + reason);
    });
  };

  $scope.doRefreshAndSync = function() {
    logger.log('doRefreshAndSync');
    ProjectService.all(false).then(function(projects) {
      $rootScope.projects = projects;
      if (SyncService.getSyncState() != "Syncing") {
        SyncService.syncTables(['MC_Project__ap', 'MC_Time_Expense__ap', 'Mobile_Log__mc'], true);
      }
    }, function(reason) {
      logger.error("doRefreshAndSync ProjectService.all " + JSON.stringify(reason));
      //console.log('promise returned reason -> ' + reason);
    });
  };

  $scope.search = {};

  $scope.clearSearch = function() {
    $scope.search.query = "";
  };

  $rootScope.$on('handleSyncTables', function(event, args) {
    //console.log("handleSyncTables called args", args);
    logger.log("Handling SyncTables " + JSON.stringify(args));
    switch (args.result.toString()) {
      case "Sync" :
        updateSyncButtonsText("Syncing...");
        SyncButtonsClass("Add", "disabled");
        break;
      case "Complete" :
        updateSyncButtonsText("Refresh and Sync");
        SyncButtonsClass("Remove", "disabled");
        break;
      case "100497" :
        updateSyncButtonsText("No device records to sync...");
        SyncButtonsClass("Remove", "disabled");
        $timeout( function() {
          updateSyncButtonsText("Refresh and Sync");
        },5000);
        break;
      case "100498" :
        updateSyncButtonsText("Sync already in progress...");
        SyncButtonsClass("Remove", "disabled");
        $timeout( function() {
          updateSyncButtonsText("Refresh and Sync");
        },5000);
        break;
      case "100402" :
        updateSyncButtonsText("Please connect before syncing");
        SyncButtonsClass("Remove", "disabled");
        break;
      default :
        if (args.result.toString().indexOf("Error") >= 0) {
          updateSyncButtonsText(args.result.toString());
          $timeout( function() {
            updateSyncButtonsText("Refresh and Sync");
          },5000);
        } else {
          updateSyncButtonsText("Refresh and Sync");
        }
        SyncButtonsClass("Remove", "disabled");
    }
  });

  function updateSyncButtonsText(newText) {
    for (var i = syncButtons.length - 1; i >= 0; --i) {
      angular.element(syncButtons[i]).html(newText);
    }
  }

  function SyncButtonsClass(action, className) {
    for (var i = syncButtons.length - 1; i >= 0; --i) {
      if (action == "Remove") {
        angular.element(syncButtons[i]).removeClass(className);
        if (className == "disabled") {
          SyncService.setSyncState("Complete");
        }
      } else {
        angular.element(syncButtons[i]).addClass(className);
        if (className == "disabled") {
          SyncService.setSyncState("Syncing");
        }
      }
    }
  }

  $interval(function() {
    $scope.checkIfSyncRequired();
  }, (1000 * 60 * 3));

  $scope.checkIfSyncRequired = function() {
    //console.log("checkIfSyncRequired");
    // Any dirty tables to sync?
    devUtils.dirtyTables().then(function(tables){
      if (tables && tables.length !== 0) {
        // Is the 'Refresh and Sync' enabled?
        if (!angular.element(storesSyncButton).hasClass("disabled")) {
          updateSyncButtonsText("Sync Required");
          SyncButtonsClass("Remove", "disabled");
        }
      }
    });
  };

}])

/*
===========================================================================
  ProjectDetailCtrl
===========================================================================
*/
.controller('ProjectDetailCtrl', ['$scope', '$rootScope', '$stateParams', '$location', '$ionicLoading', 'ProjectService', 'logger', function($scope, $rootScope, $stateParams, $location, $ionicLoading,  ProjectService, logger) {

  // Listen for event broadcast when new Time/Expense created
  var unregisterGetTotalsEvent =  $rootScope.$on('handleRefreshProjectTotals', function(event) {
    getProjectTotals();
  });

  // Unregister the event listener when the current scope is destroyed
  $scope.$on('$destroy', function() {
    unregisterGetTotalsEvent();
  });

  $scope.project = ProjectService.get($stateParams.projectId);
  $scope.project.formDescription = $scope.project.mc_package_002__Description__c;

  getProjectTotals();

  function getProjectTotals() {
    // Calculate the total Time and Expense values displayed on the project details
    ProjectService.getProjectTotals($stateParams.projectId).then(function(retObject) {
      $scope.totalExpense = retObject.totalExpense;
      $scope.hours = Math.floor(retObject.totalTime / 60);
      $scope.minutes = retObject.totalTime % 60;
      $scope.$apply();
    }).catch(function(returnErr) {
      logger.error('getProjectTotals ' + JSON.stringify(returnErr));
    });
  }

  var localProjCB = function(localProjects) {
    if (localProjects.length > 0) {
      $rootScope.projects = localProjects;
      $ionicLoading.hide();
      $location.path('/projects');
    }
  };

  /*
   * Handle submitForm : here we need to take any 'form fields', map them to
   * the MC object and call the update.
   */
  $scope.submitForm = function() {
    //console.log('submitForm');
    $ionicLoading.show({
      template: '<h1>Saving...</h1><p>Saving project...</p><i class="icon ion-loading-b" style="font-size: 32px"></i>',
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 600,
      duration: 30000
    });
    var newProj = {};
    newProj.Id = $scope.project.Id;
    newProj.mc_package_002__Description__c  = $scope.project.formDescription;
    //console.log('update, project -> ' + angular.toJson(newProj));
    ProjectService.update(newProj).then(function(retObject) {
      //console.log('update, retObject -> ' + angular.toJson(retObject));
      // Call with local callback function so project list is displayed quickly while background sync continues
      return ProjectService.all(true, localProjCB);
    }).then(function(projects) {
        $rootScope.projects = projects;
        $ionicLoading.hide();
        logger.error("Simulating an error when updating project " + $scope.project.Name);
        $location.path('/projects');
    }).catch(function(returnErr) {
      logger.error('getProjectTotals ' + JSON.stringify(returnErr));
      $ionicLoading.hide();
    });
  };

}])

/*
===========================================================================
  ProjectExpenseCtrl - list of Times or Expenses
===========================================================================
*/
.controller('ProjectExpenseCtrl', ['$scope', '$stateParams', 'ProjectService', function($scope, $stateParams, ProjectService) {

  switch ($stateParams.type) {
      case 'time' : $scope.paramType = "Timesheets";
        break;
      default :  $scope.paramType = 'Expenses';
    }

  ProjectService.expenses($stateParams.type, $stateParams.projectId).then(function(timesheets) {
    $scope.expenses = timesheets;
  }, function(reason) {
    console.error('promise returned error, reason -> ' + reason);
  });

}])

/*
===========================================================================
  ProjectExpNewCtrl - New Time or Expense
===========================================================================
*/
.controller('ProjectExpNewCtrl', ['$scope', '$rootScope', '$stateParams', '$ionicLoading', '$ionicPopup', '$ionicModal', '$location', '$cordovaBarcodeScanner', 'ProjectService', 'Camera', 'logger', function($scope, $rootScope, $stateParams, $ionicLoading, $ionicPopup, $ionicModal, $location, $cordovaBarcodeScanner, ProjectService, Camera, logger) {

  switch ($stateParams.type) {
      case 'time' :
        $scope.paramType = "Timesheet";
        break;
      default :
        $scope.paramType = 'Expense';
    }
  $scope.projectId = $stateParams.projectId;
  $scope.description = "";

  /*
   * Handle submitForm
   */
  $scope.submitForm = function() {
    varNewExp = {
      "mc_package_002__Short_Description__c": $scope.expenseForm.description.$modelValue,
      "Name": 'TMP-' + Date.now(),
      "mc_package_002__Project__c": $stateParams.projectId
    };
    switch ($stateParams.type) {
      case 'time' :
        varNewExp.mc_package_002__Duration_Minutes__c = $scope.expenseForm.expenseValue.$modelValue;
        break;
      default :
        varNewExp.mc_package_002__Expense_Amount__c = $scope.expenseForm.expenseValue.$modelValue;
    }
    //console.log('ProjectExpNewCtrl, varNewExp -> ' + angular.toJson(varNewExp));
    $ionicLoading.show({
      duration: 30000,
      delay : 400,
      maxWidth: 600,
      noBackdrop: true,
      template: '<h1>Saving...</h1><p id="app-progress-msg" class="item-icon-left">Saving ' + $stateParams.type + ' record...<ion-spinner/></p>'
    });
    ProjectService.newExpense(varNewExp,
      function(){
        $ionicLoading.hide();
        $rootScope.$broadcast('refreshProjectTotals');
        $location.path("/tab/project/" + $stateParams.projectId);
      },
      function(e) {
        console.error('ProjectExpNewCtrl, error', e);
        $ionicLoading.hide();
        var alertPopup = $ionicPopup.alert({
          title: 'Insert failed!',
          template: '<p>Sorry, something went wrong.</p><p class="error_details">Error: ' + e.status + ' - ' + e.mc_add_status + '</p>'
        });
      });
  };

  $scope.scanImageData = null;

  $scope.scanBarcode = function() {
    if (cordova && cordova.plugins && cordova.plugins.barcodeScanner) {
      $cordovaBarcodeScanner.scan().then(function(imageData) {
        //console.log("Cancelled -> " + imageData.cancelled);
        if (!imageData.cancelled) {
          $scope.scanImageData = imageData;
          //console.log("Barcode Format -> " + imageData.format);
        }
      }, function(error) {
        console.error(err);
      });
    } else {
      $scope.scanImageData = "9999092920299";
    }
  };

  $scope.photoImageData = null;

  $scope.capturePhoto = function() {
    Camera.getPicture().then(function(imageData) {
      //console.log('capturePhoto success');
      $scope.photoImageData = imageData;
    }, function(err) {
      console.error(err);
    });
  };

}])

 /*
  ===========================================================================
    M O B I L C A D D Y     S E T T I N G S
  ===========================================================================
  */

.controller('SettingsHBCtrl', ['$scope', '$rootScope', 'DevService', 'NetworkService', function($scope, $rootScope, DevService, NetworkService) {

  if (localStorage.connection) {
    $scope.heartbeatStatus = localStorage.connection;
  } else {
    $scope.heartbeatStatus = 100100;
  }

  $scope.hbUpdate = function() {
    localStorage.connection = $scope.heartbeatStatus;
    if ($scope.heartbeatStatus == 100100) NetworkService.networkEvent('online');
    if ($scope.heartbeatStatus == 100103) NetworkService.networkEvent('offline');
  };

}])

.controller('SettingsCtrl', ['$scope', '$rootScope', '$ionicPopup', '$ionicLoading', '$location', 'devUtils', 'vsnUtils', 'DevService', 'ProjectService', function($scope, $rootScope, $ionicPopup, $ionicLoading, $location, devUtils, vsnUtils, DevService, ProjectService) {

  /*
  ---------------------------------------------------------------------------
    Main settings page
  ---------------------------------------------------------------------------
  */
  $scope.logoutAllowedClass = 'disabled';
  $scope.recsToSyncCount = 0;

  $scope.codeflow = LOCAL_DEV;

  $scope.upgradeAvailable = false;
  vsnUtils.upgradeAvailable().then(function(res){
    if (res)  return devUtils.dirtyTables();
  }).then(function(tables){
    if (tables && tables.length === 0) {
      $scope.upgradeAvailable = true;
      $scope.$apply();
    }
  });

  DevService.allRecords('recsToSync', false)
    .then(function(recsToSyncRecs) {
    $scope.recsToSyncCount = tableRecs.length;
    if ($scope.recsToSyncCount === 0) {
      $scope.logoutAllowedClass = '';
    } else {
      $scope.recsToSyncCount  = 0;
    }
  }, function(reason) {
    console.error('promise returned reason -> ' + reason);
  });


  DevService.allRecords('appSoup', false)
    .then(function(appSoupRecs) {
    $scope.settingsRecs = extractSettingsValues(appSoupRecs);
  }, function(reason) {
    console.error('promise returned reason -> ' + reason);
  });

  function extractSettingsValues(appSoupRecs) {
    var settingRecs = {};
    $j.each(appSoupRecs, function(i,records) {
      var tableRec = {};
      $j.each(records, function(i,record) {
        switch (record.Name) {
          case "Name" :
            tableRec.Name = record.Value;
            break;
          case "CurrentValue" :
            tableRec.Value = record.Value;
            break;
        }
      }); // end loop through the object fields
      settingRecs[tableRec.Name] = tableRec.Value;
    });
    return settingRecs;
  }


  /*
  ---------------------------------------------------------------------------
    Utility Functions
  ---------------------------------------------------------------------------
  */
  function validateAdminPassword(pword) {
    return (pword == "123") ?  true : false;
  }

  $scope.upgradeIfAvailable = function() {
    devUtils.dirtyTables().then(function(tables){
      if (tables && tables.length === 0) {
        var confirmPopup = $ionicPopup.confirm({
          title: 'Upgrade',
          template: 'Are you sure you want to upgrade now?'
        });
        confirmPopup.then(function(res) {
          if(res) {
            $ionicLoading.show({
              duration: 30000,
              delay : 400,
              maxWidth: 600,
              noBackdrop: true,
              template: '<h1>Upgrade app...</h1><p id="app-upgrade-msg" class="item-icon-left">Upgrading...<ion-spinner/></p>'
            });
            vsnUtils.upgradeIfAvailable().then(function(res){
              //console.log('upgradeIfAvailable', res);
            }).catch(function(e){
              console.error(e);
              $ionicLoading.hide();
            });
          }
        });
      } else {
        $scope.data = {};
        $ionicPopup.show({
          title: 'Upgrade',
          subTitle: 'Unable to upgrade. A sync is required - please try later.',
          scope: $scope,
          buttons: [
            {
              text: 'OK',
              type: 'button-positive',
              onTap: function(e) {
                return true;
              }
            }
          ]
        });
      }
    });
  };

  /*
  ---------------------------------------------------------------------------
    Log in/out
  ---------------------------------------------------------------------------
  */
  $scope.showAdminPasswordPopup = function() {
    var adminTimeout = (1000 * 60 * 5); // 5 minutes
    if ($rootScope.adminLoggedIn > Date.now() - adminTimeout) {
      $location.path('tab/settings/devtools');
      $rootScope.adminLoggedIn = Date.now();
    } else {
      $scope.data = {};
      var myPopup = $ionicPopup.show({
        template: '<input type="password" ng-model="data.admin">',
        title: 'Enter Admin Password',
        scope: $scope,
        buttons: [
          { text: 'Cancel' },
          { text: '<b>Continue</b>',
            type: 'button-positive',
            onTap: function(e) {
            if (validateAdminPassword($scope.data.admin)) {
                $location.path('tab/settings/devtools');
                $rootScope.adminLoggedIn = Date.now();
              } else {
                //console.log("Password incorrect");
              }
            }
          },
        ]
      });
    }
  };

  $scope.showConfirmLogout = function() {
   var confirmPopup = $ionicPopup.confirm({
     title: 'Logout',
     template: 'Are you sure you want to logout?'
   });
   confirmPopup.then(function(res) {
     if(res) {
       $rootScope.adminLoggedIn = null;
       cordova.require("com.salesforce.plugin.sfaccountmanager").logout();
     }
   });
  };


  $scope.showConfirmReset = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Reset App Data',
      template: 'Are you sure you want to reset ALL application data?'
    });
    confirmPopup.then(function(res) {
      if(res) {
        //console.log("Resetting app");
        var vsnUtils = mobileCaddy.require('mobileCaddy/vsnUtils');
        var i;
        var name;
        $ionicLoading.show({
          duration: 30000,
          delay : 400,
          maxWidth: 600,
          noBackdrop: true,
          template: '<h1>Resetting app...</h1><p id="app-progress-msg" class="item-icon-left">Clearing data...<ion-spinner/></p>'
        });
        vsnUtils.hardReset().then(function(res){
          //$ionicLoading.hide();
        }).catch(function(e){
          console.error(e);
          $ionicLoading.hide();
        });
      }
    });
  };

  $scope.setLogLevel = function() {
    if ($scope.log.level == "Off") {
      localStorage.removeItem('logLevel');
    } else {
      localStorage.setItem('logLevel', $scope.log.level);
    }
    $scope.log.levelChange = false;
  };

  $scope.getLogLevel = function() {
    var logLevel = localStorage.getItem("logLevel");
    if (logLevel === null) {
      logLevel = "Off";
    }
    return logLevel;
  };

  $scope.logLevelChange = function() {
    $scope.log.levelChange = true;
  };

  $scope.log = {};
  $scope.log.level = $scope.getLogLevel();
  $scope.log.levelChange = false;

}])


.controller('TestingCtrl', ['$scope', '$cordovaLocalNotification', 'AppRunStatusService', 'NotificationService', function($scope, $cordovaLocalNotification, AppRunStatusService, NotificationService) {

  $scope.resumeEvent = function() {
    //console.log("resumeEvent");
    AppRunStatusService.statusEvent('resume');
  };

  $scope.localNotification = function(id) {
    var alarmTime = new Date();
    alarmTime.setSeconds(alarmTime.getSeconds() + 15);
    var args = {
      id: 100100,
      at: alarmTime,
      title: "Unsynced records",
      text: "Unsynced records on device",
      sound: null};
    if(device.platform == "Android") {
       args.ongoing = true;
       args.smallIcon = "res://icon";
    }
    $cordovaLocalNotification.schedule(args).then(function () {
      //console.log("The notification 100100 has been set for 15 seconds");
    }) ;
  };

  $scope.localNotificationTrigger = function(id) {
    NotificationService.handleLocalNotification(id, 'foreground');
  };

}])

/*
---------------------------------------------------------------------------
  MTI (Mobile Table Inspector)
---------------------------------------------------------------------------
*/
.controller('MTICtrl', ['$scope', '$rootScope', '$location', '$ionicPopup', 'DevService', function($scope, $rootScope, $location, $ionicPopup, DevService) {

  var adminTimeout = (1000 * 60 *5 ); // 5 minutes
  if ( $rootScope.adminLoggedIn > Date.now() - adminTimeout) {
  } else {
    $location.url('tab/settings');
    var alertPopup = $ionicPopup.alert({
      title: 'Access Denied'
    });
    alertPopup.then(function(res) {
      //$location.url('tab/settings');
      $scope.$apply();
    });
  }

  DevService.allTables().then(function(tables) {
    $scope.tables = tables;
  }, function(reason) {
    console.error('promise returned reason -> ' + reason);
  });

}])

.controller('MTIDetailCtrl', ['$scope', '$rootScope', '$stateParams', '$ionicLoading', 'DevService', function($scope, $rootScope,$stateParams, $ionicLoading, DevService) {
  $ionicLoading.show({
    duration: 30000,
    delay : 400,
    noBackdrop: true,
    template: '<p id="app-progress-msg" class="item-icon-left">Fetching records...<ion-spinner/></p>'
  });
  $scope.table = {'Name': $stateParams.tableName};
  DevService.allRecords($stateParams.tableName, false)
    .then(function(tableRecs) {
    $scope.tableRecs = tableRecs;
    $ionicLoading.hide();
  }, function(reason) {
    console.error('promise returned error -> ' + reason);
  });

  $scope.getItemHeight = function(item, index) {
    return (typeof(item) != "undefined")  ? 100 + item.length*55 : 0;
  };
}])


/*
---------------------------------------------------------------------------
  Deploy Control
---------------------------------------------------------------------------
*/
.controller('DeployCtrl', ['$scope', '$rootScope', 'DeployService', function($scope, $rootScope, DeployService) {

  function iconForErr(errType) {
    switch(errType) {
        case 'info':
            return 'ion-information-circled';
        default:
            return 'ion-close-round';
    }
  }

  var messages = [{message : 'Uploading bundle...', type : ''}];
  var appConfig = {};

  $scope.messages = messages;

  DeployService.getDetails().then(function(data){
    //console.log('data', data);
    appConfig = data;
    return DeployService.deployBunlde(appConfig);
  }).then(function(res){
    console.dir(res);
    var msg = {message : res, type : 'ok', icon : "ion-checkmark-round"};
    $scope.$apply(function() {
      $scope.messages.push(msg);
      msg = {message : 'Uploading cache manifest...', type : ''};
      $scope.messages.push(msg);
    });
    return DeployService.uploadCachePage(appConfig);
  }).then(function(res){
    console.dir(res);
    var msg = {message : res, type : 'ok', icon : "ion-checkmark-round"};
    $scope.$apply(function() {
      $scope.messages.push(msg);
      msg = {message : 'Uploading start page...', type : ''};
      $scope.messages.push(msg);
    });
    return DeployService.uploadStartPage(appConfig);
  }).then(function(res){
    console.dir(res);
    var msg = {message : res, type : 'ok', icon : "ion-checkmark-round"};
    $scope.$apply(function() {
      $scope.messages.push(msg);
      msg = {message : 'Deploy Completed successfully.', type : 'final'};
      $scope.messages.push(msg);
    });
  }).catch(function(err){
    var msg = {message : err.message, type : err.type,  icon : iconForErr(err.type)};
    $scope.$apply(function() {
      $scope.messages.push(msg);
      if (err.type != 'error') {
         msg = {message : 'Deploy Completed successfully.', type : 'final'};
        $scope.messages.push(msg);
      }
    });
    //console.log(err);
  });
}])

/*
===========================================================================
  D I R E C T I V E S
===========================================================================
*/

// hide-tabs
// Usage: add hide-tabs to ion-view on page you want to hide tabs.
// (tabsMain.html references $rootScope.hideTabs)
.directive('hideTabs', function($rootScope) {
  return {
      restrict: 'A',
      link: function($scope, $el) {
          $rootScope.hideTabs = 'tabs-item-hide';
          $scope.$on('$destroy', function() {
            $rootScope.hideTabs = '';
          });
      }
  };
})
;