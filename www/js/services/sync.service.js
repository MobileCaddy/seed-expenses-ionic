/**
 * Sync Factory
 *
 * @description Handles Sync calls to the MobileCaddy API amd gets/sets app
 * sync status.
 */
(function() {
  'use strict';

  angular
    .module('starter.services')
    .factory('SyncService', SyncService);

  SyncService.$inject = ['$rootScope', 'devUtils','NotificationService'];

  function SyncService($rootScope, devUtils, NotificationService) {


	  return {
	    getSyncLock: function(syncLockName){
	      var syncLock = localStorage.getItem(syncLockName);
	      if (syncLock === null) {
	        syncLock = "false";
	        localStorage.setItem(syncLockName, syncLock);
	      }
	      //console.log("mc getSyncLock syncLock", syncLock);
	      return syncLock;
	    },

	    setSyncLock: function(syncLockName, status){
	      localStorage.setItem(syncLockName, status);
	      //console.log("mc setSyncLock", syncLockName, status);
	    },

	    getSyncState: getSyncState,

	    setSyncState: setSyncState,

	    initialSync: initialSync,

	    syncTables: syncTables
	  };


	  function initialSync(tablesToSync) {
	    setSyncState("Syncing");

	    devUtils.initialSync(tablesToSync).then(function(res){
	      $rootScope.$broadcast('syncTables', {result : "Complete"});
	      setSyncState("Complete");
	    });
	  }


	  function  syncTables(tablesToSync, syncWithoutLocalUpdates, maxTableAge) {
	    // Check to make sure we don't already have a sync in progress.
	    // MobileCaddy Utils will also check for this condition, but we'll check before calling utils
	    if (getSyncState() == "Syncing") {
	      return;
	    }
	    setSyncState("Syncing");
	    if (typeof(maxTableAge) == "undefined") {
	      maxTableAge = (1000 * 60 * 3); // 3 minutes
	    }
	    $rootScope.$broadcast('syncTables', {result : "Sync"});

	    var stopSyncing = false;
	    var firstSync = true;
	    var syncCount = 0;
	    var sequence = Promise.resolve();
	    var maxRecsPerCall = 50;

	    tablesToSync.forEach(function(table){
	      sequence = sequence.then(function() {
	        syncCount ++;
	        //console.log("syncTables",table,syncCount,maxRecsPerCall);
	        if (stopSyncing) {
	          return {status: "100999"};  // "100999" is not an official code (used to indicate stopping of sync)
	        } else {
	          //console.log("syncTables call syncMobileTable",table,syncWithoutLocalUpdates,maxTableAge,maxRecsPerCall);
	          return devUtils.syncMobileTable(table, syncWithoutLocalUpdates, maxTableAge, maxRecsPerCall);
	        }
	      }).then(function(resObject) {
	        //console.log('syncTables syncMobileTable result',angular.toJson(resObject),firstSync,syncCount);
	        if (typeof(resObject.status) != "undefined" && resObject.status != "100400") {
	          if (resObject.status != "100999") {
	            // We haven't stopped the sync
	            if (resObject.status == "100497" ||
	                resObject.status == "100498" ||
	                resObject.status == "100402" ||
	                (typeof(resObject.mc_add_status) != "undefined" && resObject.mc_add_status == "sync-too-soon")) {
	              // "100497" => table is too young (synced recently) -> break out of any further syncing attempts
	              // "100498" => sync already in progress
	              // "100402" => error (e.g. offline, timeout)
	              // We stop syncing if the first sync has a problem
	              if (firstSync) {
	                stopSyncing = true;
	                $rootScope.$broadcast('syncTables', {result : resObject.status});
	                setSyncState("Complete");
	              }
	            }
	            // Unable to sync -> set a localnotification
	            //NotificationService.setLocalNotification();
	          }
	        } else {
	          //NotificationService.cancelNotifications();
	        }
	        if (syncCount == tablesToSync.length && !stopSyncing) {
	          // All syncs complete
	          $rootScope.$broadcast('syncTables', {result : "Complete"});
	          setSyncState("Complete");
	        }
	        firstSync = false;
	      }).catch(function(res){
	        if (typeof(res.status) != "undefined" &&
	             (res.status == "100497" ||
	              res.status == "100498" ||
	              res.status == "100402")) {
	          //console.log(res);
	          $rootScope.$broadcast('syncTables', {result : "Complete"});
	        } else {
	          console.error(res);
	          $rootScope.$broadcast('syncTables', {result : "Error"});
	        }
	        //NotificationService.setLocalNotification();
	        setSyncState("Complete");
	      });
	    });
	  }

	  function getSyncState(){
      var syncState = localStorage.getItem("syncState");
      if (syncState === null) {
        syncState = "Complete";
        localStorage.setItem("syncState", syncState);
      }
      return syncState;
    }

 		function setSyncState(status){
      localStorage.setItem("syncState", status);
    }

  }

})();