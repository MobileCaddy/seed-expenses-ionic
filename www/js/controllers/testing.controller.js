/**
 * Testing Controller
 *
 * @description controller for testing functions in the settings pages
 */
(function() {
  'use strict';

  angular
    .module('starter.controllers')
    .controller('TestingCtrl', TestingCtrl);

  TestingCtrl.$inject = ['$scope', 'AppRunStatusService', 'NotificationService'];

  function TestingCtrl($scope, AppRunStatusService,NotificationService) {

	  $scope.resumeEvent = function() {
	    console.debug("resumeEvent");
	    AppRunStatusService.statusEvent('resume');
	  };

    $scope.localNotificationTrigger = function(id) {
      console.debug('localNotificationTrigger', id);
      NotificationService.handleLocalNotification(id);
    };

  }

})();