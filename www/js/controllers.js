angular.module('starter.controllers', ['ionic'])

.controller('ProjectIndexCtrl', function($scope, $rootScope, $ionicLoading, ProjectService) {

  // This unhides the nav-bar. The navbar is hidden in the cases where we want a
  // splash screen, such as in this app
  e = document.getElementById('my-nav-bar');
  angular.element(e).removeClass( "mc-hide" );

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
    console.log('Angular: localProjCB, got projects with arr len', localProjects.length);
    if (localProjects.length > 0) $ionicLoading.hide();
  };

  ProjectService.all($rootScope.refreshFlag, localProjCB).then(function(projects) {
    $rootScope.projects = projects;
    console.log('Angular: ProjectIndexCtrl, got projects');
    $ionicLoading.hide();
  }, function(reason) {
    console.log('Angular: promise returned reason -> ' + reason);
  });
  $rootScope.refreshFlag = false;

  $scope.doRefresh = function() {
  	console.log('Angular: doRefresh');
  	ProjectService.all(true).then(function(projects) {
      $rootScope.projects = projects;
      console.log('Angular: ProjectIndexCtrl, projects -> ' + angular.toJson($rootScope.projects));
    }, function(reason) {
      console.log('Angular: promise returned reason -> ' + reason);
    });
  };
})


.controller('ProjectDetailCtrl', function($scope, $rootScope, $stateParams, $location, $ionicLoading,  ProjectService) {
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
    console.log('Angular: submitForm');
    var newProj = {};
    newProj.Id = $scope.project.Id;
    newProj.mc_package_002__Description__c  = $scope.project.formDescription;
    console.log('Angular: update, project -> ' + angular.toJson(newProj));
    $ionicLoading.show({
      template: '<h1>Saving...</h1><p>Saving project...</p><i class="icon ion-loading-b" style="font-size: 32px"></i>',
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 600,
      duration: 30000
    });
    ProjectService.update(newProj).then(function(retObject) {
      console.log('Angular: update, retObject -> ' + angular.toJson(retObject));
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
})

.controller('ProjectExpenseCtrl', function($scope, $stateParams, ProjectService) {
  console.log('Angular : ProjectExpenseCtrl, projectId ->' + $stateParams.projectId);
  switch ($stateParams.type) {
      case 'time' : $scope.recordType = "Timesheets";
        break;
      default :  $scope.recordType = 'Expenses';
    }
  ProjectService.expenses($stateParams.type, $stateParams.projectId).then(function(timesheets) {
    $scope.expenses = timesheets;
    console.log('Angular: ProjectExpenseCtrl -> ' + angular.toJson($scope.expenses ));
  }, function(reason) {
    console.error('Angular: promise returned error, reason -> ' + reason);
  });
})



.controller('ProjectExpNewCtrl', function($scope, $stateParams, $ionicLoading, $ionicPopup, $ionicModal, ProjectService) {

  switch ($stateParams.type) {
      case 'time' :
        $scope.recordType = "Timesheet";
        valueFieldName = "mc_package_002__Duration_Minutes__c";
        break;
      default :
        $scope.recordType = 'Expense';
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
    console.log('Angular: ProjectExpNewCtrl, varNewExp -> ' + angular.toJson(varNewExp));
    $ionicLoading.show({
      duration: 30000,
      delay : 400,
      maxWidth: 600,
      noBackdrop: true,
      template: '<h1>Saving...</h1><p id="app-progress-msg" class="item-icon-left">Saving ' + $stateParams.type + ' record...<ion-spinner/></p>'
    });
    ProjectService.newExpense(varNewExp,
      function(){
        console.log('Angular: ProjectExpNewCtrl, success');
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

})

 /*
  ===========================================================================
    M O B I L C A D D Y     S E T T I N G S
  ===========================================================================
  */

.controller('SettingsHBCtrl', function($scope, $rootScope, DevService) {

  if (localStorage.connection) {
    $scope.heartbeatStatus = localStorage.connection;
  } else {
    $scope.heartbeatStatus = 100100;
  }

  $scope.hbUpdate = function() {
    localStorage.connection = $scope.heartbeatStatus;
  };

})

  .controller('SettingsCtrl', function($scope, $rootScope, $ionicPopup, $ionicLoading, $location, DevService, ProjectService) {

  /*
  ---------------------------------------------------------------------------
    Main settings page
  ---------------------------------------------------------------------------
  */
  $scope.logoutAllowedClass = 'disabled';
  $scope.recsToSyncCount = 0;

  $scope.codeflow = LOCAL_DEV;

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
                $scope.$apply();
              } else {
                console.log("Password incorrect");
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
        console.debug("Resetting app");
        var i;
        var name;
        if ( window.location.host == "localhost:3030" ) {
          // Codeflow emulator
          for (i = 0; i < localStorage.length; i++) {
            name = localStorage.key( i );
            if ( name != 'forceOAuth' ) smartstore.removeSoup(name);
          }
          window.location.assign(window.location.protocol + "//" + window.location.host + "/www");
        } else if ( typeof(mockStore) != "undefined" ) {
          // Platform emulator
          for (i = 0; i < localStorage.length; i++) {
            name = localStorage.key( i );
            if ( name != 'forceOAuth' )  smartstore.removeSoup(name);
          }
          var newUrl = window.location.href.substr(0, window.location.href.indexOf('#'));
          window.location.assign(newUrl);
        } else {
          // Device
          DevService.allTables().then(function(tables) {
            smartstore = cordova.require('com.salesforce.plugin.smartstore');
            tables.forEach(function(table){
              console.debug("Calling smartstore.removeSoup for " + table.Name);
              smartstore.removeSoup(table.Name);
            });
            aouth = cordova.require('salesforce/plugin/oauth');
            aouth.getAppHomeUrl(function(homePage) {
              window.history.go( -( history.length - 1 ) );
            });
            //SupportMc.singleton.startUp();
          }, function(reason) {
            console.error('Angular: promise returned reason -> ' + reason);
          });

        }
      }
    });
  };


})

/*
---------------------------------------------------------------------------
  MTI (Mobile Table Inspector)
---------------------------------------------------------------------------
*/
.controller('MTICtrl', function($scope, $rootScope, $location, $ionicPopup, DevService) {

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

})

.controller('MTIDetailCtrl', function($scope, $rootScope,$stateParams, $ionicLoading, DevService) {
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
})


/*
---------------------------------------------------------------------------
  Deploy Control
---------------------------------------------------------------------------
*/
.controller('DeployCtrl', function($scope, $rootScope, DeployService) {

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
    console.log('data', data);
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
    console.debug(err);
  });
});