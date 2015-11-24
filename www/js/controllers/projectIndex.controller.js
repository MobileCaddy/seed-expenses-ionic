/**
 * ProjectIndex Controller
 *
 * @description Controller for the projects listing
 */
(function() {
  'use strict';

  angular
    .module('starter.controllers')
    .controller('ProjectIndexCtrl', ProjectIndexCtrl);

  ProjectIndexCtrl.$inject = ['$scope', '$rootScope', '$ionicLoading', '$interval', '$timeout', 'ProjectService', 'SyncService', 'devUtils'];

  function ProjectIndexCtrl($scope, $rootScope, $ionicLoading, $interval, $timeout, ProjectService, SyncService, devUtils) {

	  // This unhides the nav-bar. The navbar is hidden in the cases where we want a
	  // splash screen, such as in this app
	  var e = document.getElementById('my-nav-bar');
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
	    syncButtonsClass("Remove", "ng-hide");
	  }, function(reason) {
	    //console.log('promise returned reason -> ' + reason);
	  });
	  $rootScope.refreshFlag = false;

	  $scope.doRefreshFromPulldown = function() {
	  	//console.log('doRefreshFromPulldown');
	  	ProjectService.all(true).then(function(projects) {
	      $rootScope.projects = projects;
	    }, function(reason) {
	      //console.log('promise returned reason -> ' + reason);
	    });
	  };

	  $scope.doRefreshAndSync = function() {
	    //console.log('doRefreshAndSync');
	    ProjectService.all(false).then(function(projects) {
	      $rootScope.projects = projects;
	      if (SyncService.getSyncState() != "Syncing") {
	        SyncService.syncTables(['MC_Project__ap', 'MC_Time_Expense__ap'], true);
	      }
	    }, function(reason) {
	      //console.log('promise returned reason -> ' + reason);
	    });
	  };

	  $scope.search = {};

	  $scope.clearSearch = function() {
	    $scope.search.query = "";
	  };

	  $rootScope.$on('handleSyncTables', function(event, args) {
	    //console.log("handleSyncTables called args", args);
	    switch (args.result.toString()) {
	      case "Sync" :
	        updateSyncButtonsText("Syncing...");
	        syncButtonsClass("Add", "disabled");
	        break;
	      case "Complete" :
	        updateSyncButtonsText("Refresh and Sync");
	        syncButtonsClass("Remove", "disabled");
	        break;
	      case "100497" :
	        updateSyncButtonsText("No device records to sync...");
	        syncButtonsClass("Remove", "disabled");
	        $timeout( function() {
	          updateSyncButtonsText("Refresh and Sync");
	        },5000);
	        break;
	      case "100498" :
	        updateSyncButtonsText("Sync already in progress...");
	        syncButtonsClass("Remove", "disabled");
	        $timeout( function() {
	          updateSyncButtonsText("Refresh and Sync");
	        },5000);
	        break;
	      case "100402" :
	        updateSyncButtonsText("Please connect before syncing");
	        syncButtonsClass("Remove", "disabled");
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
	        syncButtonsClass("Remove", "disabled");
	    }
	  });

	  function updateSyncButtonsText(newText) {
	    for (var i = syncButtons.length - 1; i >= 0; --i) {
	      angular.element(syncButtons[i]).html(newText);
	    }
	  }

	  function syncButtonsClass(action, className) {
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
	          syncButtonsClass("Remove", "disabled");
	        }
	      }
	    });
	  };

  }

})();