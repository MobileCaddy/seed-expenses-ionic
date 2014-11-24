angular.module('starter.controllers', ['ionic'])

.controller('ProjectIndexCtrl', function($scope, $rootScope, ProjectService) {

  ProjectService.all(false).then(function(projects) {
    $rootScope.projects = projects;
    console.log('Angular: ProjectIndexCtrl, got projects');
  }, function(reason) {
    console.log('Angular: promise returned reason -> ' + reason);
  });



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


.controller('ProjectDetailCtrl', function($scope, $stateParams, ProjectService) {
  $scope.project = ProjectService.get($stateParams.projectId);
  $scope.project.formDescription = $scope.project.Description__c;
  // Handle submitForm : here we need to take any 'form fields', map them to
  // the MC object and call the update.
  $scope.submitForm = function() {
    console.log('Angular: submitForm');
    $scope.project.Description__c = $scope.project.formDescription;
    delete $scope.project.formDescription;
    delete $scope.project.location;
    delete $scope.project.$$hashKey;
    console.log('Angular: update, project -> ' + angular.toJson($scope.project));
    ProjectService.update($scope.project);
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



.controller('ProjectExpNewCtrl', function($scope, $stateParams, $ionicPopup, $ionicModal, ProjectService) {

  switch ($stateParams.type) {
      case 'time' :
        $scope.recordType = "Timesheet";
        valueFieldName = "Duration_Minutes__c";
        break;
      default :
        $scope.recordType = 'Expense';
        valueFieldName = "Expense_Amount__c";
    }
  $scope.projectId = $stateParams.projectId;
  $scope.description = "";

  $scope.submitForm = function() {
    varNewExp = {
      "Short_Description__c": $scope.expenseForm.description.$modelValue,
      "Name"       : 'TBC-' + Date.now(),
      "Project__c" : $stateParams.projectId
    };
    switch ($stateParams.type) {
      case 'time' :
        varNewExp.Duration_Minutes__c = $scope.expenseForm.expenseValue.$modelValue;
        break;
      default :
        varNewExp.Expense_Amount__c = $scope.expenseForm.expenseValue.$modelValue;
    }
    console.log('Angular: ProjectExpNewCtrl, varNewExp -> ' + angular.toJson(varNewExp));
    ProjectService.newExpense(varNewExp,
      function(){
        console.log('Angular: ProjectExpNewCtrl, success');
        window.history.back();
      },
      function(e) {
        console.error('Angular: ProjectExpNewCtrl, error');
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

  .controller('SettingsCtrl', function($scope, $rootScope, $ionicPopup, $location, DevService) {


  /*
  ---------------------------------------------------------------------------
    Main settings page
  ---------------------------------------------------------------------------
  */
  $scope.logoutAllowedClass = 'disabled';
  $scope.recsToSyncCount = 0;

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