angular.module('starter.controllers', ['ionic'])

.controller('ProjectIndexCtrl', function($scope, $rootScope, $ionicLoading, ProjectService) {

  // Setup the loader and starting templates
  if (typeof($rootScope.child) == "undefined") {
    $ionicLoading.show({
      template: '<h1>Loading...</h1><p>Fetching Projects...</p><p><i class="icon ion-loading-b" style="font-size: 32px"></i>',
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 600,
      duration: 30000
    });
  }

  var localProjCB = function(localProjects) {
    $rootScope.projects = localProjects;
    console.log('Angular: localProjCB, got projects with arr len', localProjects.length);
    if (localProjects.length > 0){
      $ionicLoading.hide();
    }
  };

  ProjectService.all($rootScope.refreshFlag, localProjCB).then(function(projects) {
    $rootScope.projects = projects;
    console.log('Angular: ProjectIndexCtrl, got projects');
    $ionicLoading.hide();
  }, function(reason) {
    console.log('Angular: promise returned reason -> ' + reason);
  });
  $rootScope.refreshFlag = false;



  $scope.getItemHeight = function(item, index) {
    // seems to be a good height
    return 70;
  };

  $scope.doRefresh = function() {
  	console.log('Angular: doRefresh');
  	ProjectService.all(true).then(function(projects) {
      $rootScope.projects = projects;
      console.log('Angular: MTICtrl, projects -> ' + angular.toJson($rootScope.projects));
    }, function(reason) {
      console.log('Angular: promise returned reason -> ' + reason);
    });
  };
})


.controller('ProjectDetailCtrl', function($scope, $rootScope, $stateParams, $ionicLoading,  ProjectService) {
  $scope.project = ProjectService.get($stateParams.projectId);
  $scope.project.formDescription = $scope.project.mc_package_002__Description__c;

  /*
   * Handle submitForm : here we need to take any 'form fields', map them to
   * the MC object and call the update.
   */
  $scope.submitForm = function() {
    console.log('Angular: submitForm');
    var newProj = $scope.project;
    newProj.mc_package_002__Description__c = newProj.formDescription;
    delete newProj.formDescription;
    delete newProj.location;
    delete newProj.$$hashKey;
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
      $ionicLoading.hide();
      $rootScope.refreshFlag = true;
      window.history.back();
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
      template: '<h1>Saving...</h1><p>Saving {$stateParams.type} record...</p><i class="icon ion-loading-b" style="font-size: 32px"></i>',
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 600,
      duration: 30000
    });
    ProjectService.newExpense(varNewExp,
      function(){
        console.log('Angular: ProjectExpNewCtrl, success');
        $ionicLoading.hide();
        window.history.back();
      },
      function(e) {
        console.error('Angular: ProjectExpNewCtrl, error');
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
    if (pword == "123") {
      return true;
    } else {
      return false;
    }
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
            if ( name != 'forceOAuth' ) {
              smartstore.removeSoup(name);
            }
          }
          window.location.assign(window.location.protocol + "//" + window.location.host + "/www");
        } else if ( typeof(mockStore) != "undefined" ) {
          // Platform emulator
          for (i = 0; i < localStorage.length; i++) {
            name = localStorage.key( i );
            if ( name != 'forceOAuth' ) {
              smartstore.removeSoup(name);
            }
          }
          var newUrl = window.location.href.substr(0, window.location.href.indexOf('#'));
          window.location.assign(newUrl);
        } else {
          // Device
          DevService.allTables().then(function(tables) {
            smartstore = cordova.require('salesforce/plugin/smartstore');
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
      noBackdrop: true,
      template: '<p id="app-progress-msg" class="item-icon-left"><i class="icon ion-loading-c"></i>Fetching records...</p>'
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
    // seems to be a good height
    return 120 + item.length*55;
  };
});