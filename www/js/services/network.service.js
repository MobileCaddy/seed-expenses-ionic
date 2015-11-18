/**
 * Network Factory
 *
 * @description Handles network events (online/offline) and kicks off tasks if needed
 */
(function() {
  'use strict';

  angular
    .module('starter.services')
    .factory('NetworkService', NetworkService);

  NetworkService.$inject = ['SyncService', 'logger'];

  function NetworkService(SyncService, logger) {
  	return {
	    networkEvent: function(status){
	      var pastStatus = localStorage.getItem('networkStatus');
	      if (status == "online" && pastStatus != status) {
	        SyncService.syncTables(['MC_Project__ap', 'MC_Time_Expense__ap'], true);
	      }
	      localStorage.setItem('networkStatus', status);
	      logger.log("NetworkService " + status);
	      return true;
	    }
	  };
  }

})();