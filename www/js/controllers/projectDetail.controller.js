/**
 * ProjectDetail Controller
 *
 * @description controller for the detailed screen for the project
 */
(function() {
  'use strict';

  angular
    .module('starter.controllers')
    .controller('ProjectDetailCtrl', ProjectDetailCtrl);

  ProjectDetailCtrl.$inject = ['$scope', '$rootScope', '$stateParams', '$location', '$ionicLoading', 'ProjectService'];

  function ProjectDetailCtrl($scope, $rootScope, $stateParams, $location, $ionicLoading,  ProjectService) {

	  // Listen for event broadcast when new Time/Expense created
	  var unregisterEvent =  $rootScope.$on('handleRefreshProjectTotals', function(event) {
	    getProjectTotals();
	  });

	  // Unregister the event listener when the current scope is destroyed
	  $scope.$on('$destroy', function() {
	    unregisterEvent();
	  });

	  $scope.project = ProjectService.get($stateParams.projectId);
	  $scope.project.formDescription = $scope.project.mobilecaddy1__Description__c;

	  getProjectTotals();

	  function getProjectTotals() {
	    // Calculate the total Time and Expense values displayed on the project details
	    ProjectService.getProjectTotals($stateParams.projectId).then(function(retObject) {
	      $scope.totalExpense = retObject.totalExpense;
	      $scope.hours = Math.floor(retObject.totalTime / 60);
	      $scope.minutes = retObject.totalTime % 60;
	      $scope.$apply();
	    }).catch(function(returnErr) {
	      console.error('update,  returnErr ->' + angular.toJson(returnErr));
	    });
	  }

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
	    //console.log('submitForm');
	    $ionicLoading.show({
	      template: '<h1>Saving...</h1><p>Saving project...</p><i class="icon ion-loading-b" style="font-size: 32px"></i>',
	      animation: 'fade-in',
	      showBackdrop: true,
	      maxWidth: 600,
	      duration: 30000
	    });
	    var newProj = {};
	    newProj.Id = $scope.project.Id;
	    newProj.mobilecaddy1__Description__c  = $scope.project.formDescription;
	    //console.log('update, project -> ' + angular.toJson(newProj));
	    ProjectService.update(newProj).then(function(retObject) {
	      //console.log('update, retObject -> ' + angular.toJson(retObject));
	      // Call with local callback function so project list is displayed quickly while background sync continues
	      return ProjectService.all(true, localProjCB);
	    }).then(function(projects) {
	        $rootScope.projects = projects;
	        $ionicLoading.hide();
	        $location.path('/projects');
	    }).catch(function(returnErr) {
	      console.error('update,  returnErr ->' + angular.toJson(returnErr));
	      $ionicLoading.hide();
	    });
	  };

  }

})();