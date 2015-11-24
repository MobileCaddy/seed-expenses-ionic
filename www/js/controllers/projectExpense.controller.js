/**
 * ProjectExpense Controller
 *
 * @description controller for the expenses listing
 */
(function() {
  'use strict';

  angular
    .module('starter.controllers')
    .controller('ProjectExpenseCtrl', ProjectExpenseCtrl);

  ProjectExpenseCtrl.$inject = ['$scope', '$stateParams', 'ProjectService'];

  function ProjectExpenseCtrl($scope, $stateParams, ProjectService) {

	  switch ($stateParams.type) {
	      case 'time' : $scope.paramType = "Timesheets";
	        break;
	      default :  $scope.paramType = 'Expenses';
	    }

	  ProjectService.expenses($stateParams.type, $stateParams.projectId).then(function(timesheets) {
	    $scope.expenses = timesheets;
	  }, function(reason) {
	    console.error('promise returned error, reason -> ' + reason);
	  });

  }

})();