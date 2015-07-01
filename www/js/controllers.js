angular.module('starter.controllers', ['ionic'])

.controller('ProjectIndexCtrl', ['$scope', '$rootScope', '$ionicLoading', 'ProjectService', function($scope, $rootScope, $ionicLoading, ProjectService) {

  // This unhides the nav-bar. The navbar is hidden in the cases where we want a
  // splash screen, such as in this app
  e = document.getElementById('my-nav-bar');
  angular.element(e).removeClass( "mc-hide" );

  // Set height of list scrollable area
  var winHeight = window.innerHeight - 125;
  var storesList = document.getElementById('project-list');
  storesList.setAttribute("style","height:" + winHeight + "px");

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

  ProjectService.all($rootScope.refreshFlag).then(function(projects) {
    $rootScope.projects = projects;
    //console.log('Angular: ProjectIndexCtrl, got projects');
    $ionicLoading.hide();
  }, function(reason) {
    //console.log('Angular: promise returned reason -> ' + reason);
  });
  $rootScope.refreshFlag = false;

  $scope.doRefresh = function() {
  	//console.log('Angular: doRefresh');
  	ProjectService.all(true).then(function(projects) {
      $rootScope.projects = projects;
      //console.log('Angular: ProjectIndexCtrl, projects -> ' + angular.toJson($rootScope.projects));
    }, function(reason) {
      //console.log('Angular: promise returned reason -> ' + reason);
    });
  };

  $scope.search = {};

  $scope.clearSearch = function() {
    $scope.search.query = "";
  };

}])

.controller('ProjectDetailCtrl', ['$scope', '$rootScope', '$stateParams', '$location', '$ionicLoading', 'ProjectService', function($scope, $rootScope, $stateParams, $location, $ionicLoading,  ProjectService) {

  $scope.project = ProjectService.get($stateParams.projectId);
  $scope.project.formDescription = $scope.project.mc_package_002__Description__c;

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
    //console.log('Angular: submitForm');
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
    //console.log('Angular: update, project -> ' + angular.toJson(newProj));
    ProjectService.update(newProj).then(function(retObject) {
      //console.log('Angular: update, retObject -> ' + angular.toJson(retObject));
      // Call with local callback function so project list is displayed quickly while background sync continues
      return ProjectService.all(true, localProjCB);
    }).then(function(projects) {
        $rootScope.projects = projects;
        $ionicLoading.hide();
        $location.path('/projects');
    }).catch(function(returnErr) {
      console.error('Angular: update,  returnErr ->' + angular.toJson(returnErr));
      $ionicLoading.hide();
    }); // end update error callback
  };

}])

.controller('ProjectExpenseCtrl', ['$scope', '$stateParams', 'ProjectService', function($scope, $stateParams, ProjectService) {

  //console.log('Angular : ProjectExpenseCtrl, projectId ->' + $stateParams.projectId);
  switch ($stateParams.type) {
      case 'time' : $scope.paramType = "Timesheets";
        break;
      default :  $scope.paramType = 'Expenses';
    }

  ProjectService.expenses($stateParams.type, $stateParams.projectId).then(function(timesheets) {
    $scope.expenses = timesheets;
    //console.log('Angular: ProjectExpenseCtrl -> ' + angular.toJson($scope.expenses ));
  }, function(reason) {
    console.error('Angular: promise returned error, reason -> ' + reason);
  });

}])

.controller('ProjectExpNewCtrl', ['$scope', '$stateParams', '$ionicLoading', '$ionicPopup', '$ionicModal', 'ProjectService', function($scope, $stateParams, $ionicLoading, $ionicPopup, $ionicModal, ProjectService) {

  switch ($stateParams.type) {
      case 'time' :
        $scope.paramType = "Timesheet";
        valueFieldName = "mc_package_002__Duration_Minutes__c";
        break;
      default :
        $scope.paramType = 'Expense';
        valueFieldName = "mc_package_002__Expense_Amount__c";
    }
  $scope.projectId = $stateParams.projectId;
  $scope.description = "";

  /*
   * Handle submitForm
   */
  $scope.submitForm = function() {
    varNewExp = {
      "mc_package_002__Short_Description__c": $scope.expenseForm.description.$modelValue,
      "Name"       : 'TMP-' + Date.now(),
      "mc_package_002__Project__c" : $stateParams.projectId
    };
    switch ($stateParams.type) {
      case 'time' :
        varNewExp.mc_package_002__Duration_Minutes__c = $scope.expenseForm.expenseValue.$modelValue;
        break;
      default :
        varNewExp.mc_package_002__Expense_Amount__c = $scope.expenseForm.expenseValue.$modelValue;
    }
    //console.log('Angular: ProjectExpNewCtrl, varNewExp -> ' + angular.toJson(varNewExp));
    $ionicLoading.show({
      duration: 30000,
      delay : 400,
      maxWidth: 600,
      noBackdrop: true,
      template: '<h1>Saving...</h1><p id="app-progress-msg" class="item-icon-left">Saving ' + $stateParams.type + ' record...<ion-spinner/></p>'
    });
    ProjectService.newExpense(varNewExp,
      function(){
        //console.log('Angular: ProjectExpNewCtrl, success');
        $ionicLoading.hide();
        window.history.back();
      },
      function(e) {
        console.error('Angular: ProjectExpNewCtrl, error', e);
        $ionicLoading.hide();
        var alertPopup = $ionicPopup.alert({
          title: 'Insert failed!',
          template: '<p>Sorry, something went wrong.</p><p class="error_details">Error: ' + e.status + ' - ' + e.mc_add_status + '</p>'
        });
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

.controller('SettingsCtrl', ['$scope', '$rootScope', '$ionicPopup', '$ionicLoading', '$location', 'DevService', 'ProjectService', function($scope, $rootScope, $ionicPopup, $ionicLoading, $location, DevService, ProjectService) {

  /*
  ---------------------------------------------------------------------------
    Main settings page
  ---------------------------------------------------------------------------
  */
  $scope.logoutAllowedClass = 'disabled';
  $scope.recsToSyncCount = 0;

  $scope.codeflow = LOCAL_DEV;

  var vsnUtils = mobileCaddy.require('mobileCaddy/vsnUtils');
  $scope.upgradeAvailable = false;
  vsnUtils.upgradeAvailable().then(function(res){
    if (res) $scope.upgradeAvailable = true;
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
    console.error('Angular: promise returned reason -> ' + reason);
  });


  DevService.allRecords('appSoup', false)
    .then(function(appSoupRecs) {
    $scope.settingsRecs = extractSettingsValues(appSoupRecs);
  }, function(reason) {
    console.error('Angular: promise returned reason -> ' + reason);
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
    var confirmPopup = $ionicPopup.confirm({
      title: 'Upgrade',
      template: 'Are you sure you want to upgrade now?'
    });
    confirmPopup.then(function(res) {
      if(res) {
        var vsnUtils = mobileCaddy.require('mobileCaddy/vsnUtils');
        vsnUtils.upgradeIfAvailable().then(function(res){
          //console.log('upgradeIfAvailable', res);
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
    if ( $rootScope.adminLoggedIn > Date.now() - adminTimeout) {
      $location.path('tab/settings/devtools');
      $rootScope.adminLoggedIn = Date.now();
      $scope.$apply();
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

}])


.controller('TestingCtrl', ['$scope', 'AppRunStatusService', function($scope, AppRunStatusService) {

  $scope.resumeEvent = function() {
    //console.log("resumeEvent");
    AppRunStatusService.statusEvent('resume');
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
    console.error('Angular: promise returned reason -> ' + reason);
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
    console.error('Angular: promise returned error -> ' + reason);
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
}]);