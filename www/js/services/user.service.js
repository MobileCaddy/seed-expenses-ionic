/**
 * User Factory
 *
 * @description Handles User
 */
(function() {
  'use strict';

  angular
    .module('starter.services')
    .factory('UserService', UserService);

  UserService.$inject = ['SyncService', 'logger'];

  function UserService(SyncService, logger) {
	  return {
	    getCurrentUserId: getCurrentUserId,

	    setCurrentUserId: setCurrentUserId,

	    hasDoneProcess: hasDoneProcess,

	    setProcessDone: setProcessDone

	  };


	  function getCurrentUserId(){
      return new Promise(function(resolve, reject) {
        var currentUserId = localStorage.getItem('currentUserId');
        if (currentUserId !== null) {
          resolve(currentUserId);
        } else {
          devUtils.getCurrentUserId().then(function(userId){
            localStorage.setItem('currentUserId', userId);
            resolve(userId);
          });
        }
      }).catch(function(resObject){
        logger.error('getCurrentUserId ' + JSON.stringify(resObject));
        reject(resObject);
      });
    }


    function setCurrentUserId(userId){
      return new Promise(function(resolve, reject) {
        localStorage.setItem('currentUserId', userId);
        resolve(true);
      }).catch(function(resObject){
        logger.error('setCurrentUserId ' + JSON.stringify(resObject));
        reject(resObject);
      });
    }


    function  hasDoneProcess(processName){
      return new Promise(function(resolve, reject) {
        var processes = JSON.parse(localStorage.getItem('processes'));
        if (processes === null) {
          resolve(false);
        } else {
          if (processes[processName] == "true") {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      }).catch(function(resObject){
        logger.error('hasDoneProcess ' + JSON.stringify(resObject));
        reject(resObject);
      });
    }


    function setProcessDone(processName){
      return new Promise(function(resolve, reject) {
        var processes = localStorage.getItem('processes');
        if (processes === null) {
          processes = {};
          processes[processName] = "true";
          localStorage.setItem('processes', JSON.stringify(processes));
          resolve(true);
        } else {
          resolve(true);
        }
      }).catch(function(resObject){
        logger.error('setProcessDone ' + JSON.stringify(resObject));
        reject(resObject);
      });
    }

  }

})();