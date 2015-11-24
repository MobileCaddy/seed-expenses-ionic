/**
 * NewExpense Controller
 *
 * @description controller for new expenses
 */
(function() {
  'use strict';

  angular
    .module('starter.controllers')
    .controller('NewExpenseCtrl', NewExpenseCtrl);

  NewExpenseCtrl.$inject = ['$scope', '$rootScope', '$stateParams', '$ionicLoading', '$ionicPopup', '$ionicModal', '$location', '$cordovaBarcodeScanner', 'ProjectService', 'Camera'];

  function NewExpenseCtrl($scope, $rootScope, $stateParams, $ionicLoading, $ionicPopup, $ionicModal, $location, $cordovaBarcodeScanner, ProjectService, Camera) {

	  switch ($stateParams.type) {
	      case 'time' :
	        $scope.paramType = "Timesheet";
	        break;
	      default :
	        $scope.paramType = 'Expense';
	    }
	  $scope.projectId = $stateParams.projectId;
	  $scope.description = "";

	  /*
	   * Handle submitForm
	   */
	  $scope.submitForm = function() {
	    var newExp = {
	      "mobilecaddy1__Short_Description__c": $scope.expenseForm.description.$modelValue,
	      "Name": 'TMP-' + Date.now(),
	      "mobilecaddy1__Project__c": $stateParams.projectId
	    };
	    switch ($stateParams.type) {
	      case 'time' :
	        newExp.mobilecaddy1__Duration_Minutes__c = $scope.expenseForm.expenseValue.$modelValue;
	        break;
	      default :
	        newExp.mobilecaddy1__Expense_Amount__c = $scope.expenseForm.expenseValue.$modelValue;
	    }
	    $ionicLoading.show({
	      duration: 30000,
	      delay : 400,
	      maxWidth: 600,
	      noBackdrop: true,
	      template: '<h1>Saving...</h1><p id="app-progress-msg" class="item-icon-left">Saving ' + $stateParams.type + ' record...<ion-spinner/></p>'
	    });
	    ProjectService.newExpense(newExp,
	      function(){
	        $ionicLoading.hide();
	        $rootScope.$broadcast('refreshProjectTotals');
	        $location.path("/tab/project/" + $stateParams.projectId);
	      },
	      function(e) {
	        console.error('NewExpenseCtrl, error', e);
	        $ionicLoading.hide();
	        var alertPopup = $ionicPopup.alert({
	          title: 'Insert failed!',
	          template: '<p>Sorry, something went wrong.</p><p class="error_details">Error: ' + e.status + ' - ' + e.mc_add_status + '</p>'
	        });
	      });
	  };

	  $scope.scanImageData = null;

	  $scope.scanBarcode = function() {
	    if (cordova && cordova.plugins && cordova.plugins.barcodeScanner) {
	      $cordovaBarcodeScanner.scan().then(function(imageData) {
	        //console.log("Cancelled -> " + imageData.cancelled);
	        if (!imageData.cancelled) {
	          $scope.scanImageData = imageData;
	          //console.log("Barcode Format -> " + imageData.format);
	        }
	      }, function(error) {
	        console.error(err);
	      });
	    } else {
	      $scope.scanImageData = "9999092920299";
	    }
	  };

	  $scope.photoImageData = null;

	  $scope.capturePhoto = function() {
	    Camera.getPicture().then(function(imageData) {
	      //console.log('capturePhoto success');
	      $scope.photoImageData = imageData;
	    }, function(err) {
	      console.error(err);
	    });
	  };

  }

})();