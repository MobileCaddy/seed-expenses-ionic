/**
 * Notification Factory
 *
 * @description Handles Notification events (online/offline) and kicks off tasks if needed
 */
(function() {
  'use strict';

  angular
    .module('starter.services')
    .factory('NotificationService', NotificationService);

  NotificationService.$inject = ['SyncService', 'logger'];

  function NotificationService(SyncService, logger) {

	  return {

	    cancelNotifications: cancelNotifications,

	    setLocalNotification: setLocalNotification,

	    handleLocalNotification: handleLocalNotification,

	    handleLocalNotificationClick: handleLocalNotificationClick

	  };


	  function cancelNotifications(id) {
	    //console.log('cancelNotifications');
	    if (cordova && cordova.plugins && cordova.plugins.notification) {
	      id =  (id) ? id : 100100;
	      $cordovaLocalNotification.cancel(id, function() {
	        //console.log('localNotification cancelled if it existed, ID = ', id);
	      });
	    }
	  }

	  function setLocalNotification(id) {
	    id =  (id) ? id : 100100;
	    //console.log('setLocalNotification');
	    return new Promise(function(resolve, reject) {
	      devUtils.dirtyTables().then(function(tables){
	        if (tables && tables.length === 0) {
	          // do nothing
	          //console.log('setLocalNotification nothing to do');
	          resolve();
	        } else {
	          var alarmTime = new Date();
	          alarmTime.setSeconds(alarmTime.getSeconds() + 600);
	          $cordovaLocalNotification.isScheduled(100100).then(function(isScheduled) {
	            if (isScheduled){
	              // update existing notification
	              //console.log('localNotification updated, ID = ', id);
	              $cordovaLocalNotification.update({
	                id: id,
	                at: alarmTime,
	              });
	            } else {
	              // set a new notification
	              //console.log("mc localNotification setting, ID = ", id);
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
	              }).then(function () {
	                  //console.log("mc localNotification has been set, ID = ", id);
	              });
	            }
	          }).catch(function(err){
	            console.error(err);
	            reject(err);
	          });
	        }
	      });
	    });
	  }

	  function handleLocalNotification(id, state) {
	    //console.log('handleLocalNotification', id, state);
	    if (cordova && cordova.plugins && cordova.plugins.notification) {
	      if (id == 100100) {
	        $cordovaLocalNotification.cancel(id, function(){});
	        devUtils.dirtyTables().then(function(tables){
	          //console.log('tables', tables);
	          if (tables && tables.length !== 0) {
	            var isOnline = $cordovaNetwork.isOnline();
	            //console.log('isOnline', isOnline);
	            if (isOnline) {
	              // take this opportunity to set our network status in case it's wrong
	              localStorage.setItem('networkStatus', 'online');
	              var syncService = $injector.get('SyncService');
	              syncService.syncTables(['MC_Project__ap', 'MC_Time_Expense__ap', 'MC_Project_Location__ap'], false);
	            } else {
	              // take this opportunity to set our network status in case it's wrong
	              localStorage.setItem('networkStatus', 'offline');
	              setLocalNotification(id);
	            }
	          }
	        });
	      }
	    }
	  }

	  function handleLocalNotificationClick(id, state) {
	    // TODO should this be the same as a non-click?
	    //console.log('handleLocalNotification', id, state);
	    if (cordova && cordova.plugins && cordova.plugins.notification) {
	      if (id == 100100) {
	        $cordovaLocalNotification.cancel(id, function(){});
	        devUtils.dirtyTables().then(function(tables){
	          //console.log('tables', tables);
	          if (tables && tables.length !== 0) {
	            var isOnline = $cordovaNetwork.isOnline();
	            //console.log('isOnline', isOnline);
	            if (isOnline) {
	              // take this opportunity to set our network status in case it's wrong
	              localStorage.setItem('networkStatus', 'online');
	              var syncService = $injector.get('SyncService');
	              syncService.syncTables(['MC_Project__ap', 'MC_Time_Expense__ap', 'MC_Project_Location__ap'], false);
	            } else {
	              // take this opportunity to set our network status in case it's wrong
	              localStorage.setItem('networkStatus', 'offline');
	              setLocalNotification(id);
	            }
	          }
	        });
	      }
	    }
	  }

  }

})();