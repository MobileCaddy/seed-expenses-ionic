/**
 * Project Factory
 *
 * @description Handles Project
 */
(function() {
  'use strict';

  angular
    .module('starter.services')
    .factory('ProjectService', ProjectService);

  ProjectService.$inject = ['$rootScope', '$q', '_', 'devUtils', 'SyncService', 'NotificationService', 'UserService'];

  function ProjectService($rootScope, $q, _, devUtils, SyncService, NotificationService, UserService) {

  	var recTypeIdTime = "012R00000009BycIAE";
	  var recTypeIdExp  = "012R00000009ByhIAE";

	  var projects = [];
	  var project = null;

	  return {
	    all: getProjects,

	    get: function(projectId) {
	      //console.log('Angular: projects->' + angular.toJson($rootScope.projects));
	      var ProjectArr =  _.where($rootScope.projects, {'Id': projectId});
	      project = ProjectArr[0];
	      //console.log('Angular: project -> ', project);
	      if (typeof(project) != "undefined") {
	        project = ProjectArr[0];
	        if(typeof ProjectArr[0].mobilecaddy1__MC_Project_Location__c != 'undefined') {
	          if (!$rootScope.locations || $rootScope.locations.length <= 0) {
	            getLocations(ProjectArr[0].mobilecaddy1__MC_Project_Location__c).then(function(locations){
	            	$rootScope.locations = locations;
	            	ProjectArr[0].location =  getLocationFromId(ProjectArr[0].mobilecaddy1__MC_Project_Location__c);
	            }).catch(function(e){
	            	console.error(e);
	            });
	          }
	          ProjectArr[0].location =  getLocationFromId(ProjectArr[0].mobilecaddy1__MC_Project_Location__c);
	        } else {
	          //console.log('Angular: no mobilecaddy1__MC_Project_Location__c in project');
	          ProjectArr[0].location = '-';
	        }
	      }
	      return project;
	    },
	    update: function(project) {
	      var deferred = $q.defer();
	      var tmpProject = angular.copy(project);
	      tmpProject.SystemModstamp = new Date().getTime();
	      devUtils.updateRecord('MC_Project__ap',tmpProject, 'Id').then(function(retObject) {
	        //console.log('Angular: update, retObject -> ' + angular.toJson(retObject));
	        deferred.resolve(retObject);
	      }).catch(function(returnErr) {
	        console.error('Angular: update,  returnErr ->' + angular.toJson(returnErr));
	        deferred.reject(returnErr);
	      });
	      return deferred.promise;
	    },

	    expenses: getTimeExpense,

	    newExpense: function(varNewExp, success, error) {
	      devUtils.insertRecord('MC_Time_Expense__ap',varNewExp).then(function(res) {
	        success(res);
	        // perform background sync
	        SyncService.syncTables(['MC_Time_Expense__ap'], true);
	      }).catch(function(e) {
	        error(e);
	      });
	    },

	    getProjectTotals: getProjectTotals

	  };


	  function getProjectsFromSmartStore() {
	    return new Promise(function(resolve, reject) {
	      devUtils.readRecords('MC_Project__ap', []).then(function(resObject) {
	        var records = _.sortBy(resObject.records, 'Name');
	        $rootScope.$broadcast('scroll.refreshComplete');
	        resolve(records);
	      }).catch(function(resObject){
	        //console.log('Angular : Error from querySoupRecords -> ' + angular.toJson(resObject));
	        reject(resObject);
	      });
	    });
	  }

	  function getProjects(refreshFlag, localProjCB) {
	    return new Promise(function(resolve, reject) {
	      var firstStartUp = (typeof $rootScope.firstStartUp == 'undefined' || $rootScope.firstStartUp === true);
	      //console.log('Angular: getProjects, firstStartUp ->' + firstStartUp);
	      if (refreshFlag || firstStartUp) {
	        if (typeof(localProjCB) != "undefined") {
	          // get localprojects if they exist and return through callback
	          getProjectsFromSmartStore()
	            .then(function(projects) {
	              localProjCB(projects);
	          });
	        }
	        $rootScope.$broadcast('syncTables', {result : "Sync"});
	        // Sync table used in list (smart store is then populated)
	        devUtils.syncMobileTable('MC_Project__ap', true).then(function(resObject){
	          //console.log('Angular : Success from syncMobileTable -> ' + angular.toJson(resObject));
	          getProjectsFromSmartStore().then(function(projects) {
	              resolve(projects);
	              // Make sure we can carry on with background syncing other tables
	              if (typeof(resObject.status) != "undefined" && resObject.status != "100400") {
	                // Couldn't sync MC_Project__ap
	                $rootScope.$broadcast('syncTables', {result : resObject.status});
	                // Unable to sync -> set a localnotification
	                NotificationService.setLocalNotification();
	              } else {
	                // Example of calling either the devUtils.syncMobileTable (synchronous) devUtils.initialSync (asynchronous).
	                // In this case we're only syncing two tables - as we've already synced the projects above.
	                // However, given the right use case, it could be moved to the app.js and used to sync all tables
	                UserService.hasDoneProcess("initialDataLoaded").then(function(result) {
	                  if (result) {
	                    // If we've already installed the app, and done an initial load of data, then sync tables using standard synchronous call
	                    SyncService.syncTables(['MC_Project_Location__ap', 'MC_Time_Expense__ap'], true);
	                  } else {
	                    // Initial install and load of data => we can do a faster asynchronous load of tables.
	                    // Calls devUtils.initialSync (from within SyncService) rather than usual devUtils.syncMobileTable call
	                    SyncService.initialSync(['MC_Project_Location__ap', 'MC_Time_Expense__ap']);
	                    // Save the fact that we've run the initial data load for the app install
	                    UserService.setProcessDone("initialDataLoaded");
	                  }
	                });
	              }
	          }, function(reason) {
	            console.error("Angular: promise returned reason -> " + reason);
	            reject('error');
	          });
	        }).catch(function(reason){
	          //console.log('Result from syncMobileTable', angular.toJson(reason), reason.status);
	          if (typeof(reason.status) != "undefined") {
	            if (reason.status == "100498" || reason.status == "100497" || reason.status == "100402") {
	              //Sync already in progress
	              getProjectsFromSmartStore()
	                .then(function(projects) {
	                resolve(projects);
	              }, function(reason) {
	                console.error("promise returned reason", reason);
	                reject(reason);
	              });
	            } else {
	              reject(reason);
	            }
	          } else {
	            reject(reason);
	          }
	        });
	      } else {
	        getProjectsFromSmartStore()
	          .then(function(projects) {
	          resolve(projects);
	        }, function(reason) {
	          console.error("Angular: promise returned reason -> " + reason);
	          reject('error');
	        });
	      }
	      $rootScope.firstStartUp = false;
	    });
	  }


	  function getLocationFromId(locationId) {
	    //console.log('Angular: locationId->' + locationId);
	    var location =  _.where($rootScope.locations, {'Id': locationId});
	    if (typeof location[0]!= 'undefined') {
	      //console.log('Angular: location->' + location[0].Name);
	      return location[0].Name;
	    } else {
	      //console.log('Angular: no location yet');
	      return '-';
	    }
	  }

	  function getLocations(locationId) {
	    return new Promise(function(resolve, reject) {
		    //console.log('Angular: getLocations');
		    devUtils.readRecords('MC_Project_Location__ap', []).then(function(resObject) {
		      // $j.each(resObject.records, function(i,record) {
		      //   $rootScope.locations.push(record);
		      // });
		      //console.log('Angular: ' + angular.toJson(locations));
		      // if (locationId != "dummy") {
		      //   $rootScope.$apply(function(){
		      //     project.location = getLocationFromId(locationId);
		      //     this.project = project;
		      //   });
		      // }
		      resolve(resObject.records);
		    }).catch(function(resObject){
		      console.error('Angular : Error from readRecords MC_Project_Location__ap -> ', resObject);
	      	reject('error', resObject);
		    });
	  	});
	  }


	   /**
	   * Returns expenses record for the project and type
	   * @param  type : 'time' | 'expense'
	   * @param  projectId : string()
	   * @return promise : array of expenses recs
	   */
	  function getTimeExpense(type, projectId) {
	    return new Promise(function(resolve, reject) {
	      //console.log('Angular: getTimeExpense');
	      var timeExpense = [];
	      devUtils.readRecords('MC_Time_Expense__ap', []).then(function(resObject) {
	        resObject.records.forEach(function(record) {
	          timeExpense.push(record);
	        });
	        //console.log('Angular: timeExpense' + angular.toJson(timeExpense));
	        //console.log('Angular: projectId' + projectId);
	        var timeExpense1 =  [];
	        if (type == "time") {
	          timeExpense1 = timeExpense.filter(function(el){
	            return (el.mobilecaddy1__Duration_Minutes__c !== null &&
	                    typeof(el.mobilecaddy1__Duration_Minutes__c) != "undefined") &&
	                    el.mobilecaddy1__Project__c == projectId;
	          });
	        } else {
	          timeExpense1 = timeExpense.filter(function(el){
	            return (el.mobilecaddy1__Expense_Amount__c !== null &&
	                    typeof(el.mobilecaddy1__Expense_Amount__c) != "undefined") &&
	                    el.mobilecaddy1__Project__c == projectId;
	          });
	        }

	        //console.log('Angular: timeExpense1' + angular.toJson(timeExpense1));
	        resolve(timeExpense1);
	      }).catch(function(resObject){
	        console.error('Angular : Error from readRecords MC_Time_Expense__ap -> ' + angular.toJson(resObject));
	        reject('error');
	      });
	    });
	  }

	  function getProjectTotals(projectId) {
	    return new Promise(function(resolve, reject) {
	      //console.log('Angular: getProjectTotals',projectId);
	      var totalExpense = 0;
	      var totalTime = 0;
	      devUtils.readRecords('MC_Time_Expense__ap', []).then(function(resObject) {
	        var records = _.where(resObject.records, {'mobilecaddy1__Project__c': projectId});
	        //console.log('Angular: getProjectTotals',records);
	        _.each(records, function(el) {
	          if (el.mobilecaddy1__Duration_Minutes__c !== null &&
	              typeof(el.mobilecaddy1__Duration_Minutes__c) != "undefined") {
	            totalTime += el.mobilecaddy1__Duration_Minutes__c;
	          } else {
	            if (el.mobilecaddy1__Expense_Amount__c !== null &&
	                typeof(el.mobilecaddy1__Expense_Amount__c) != "undefined") {
	              totalExpense += el.mobilecaddy1__Expense_Amount__c;
	            }
	          }
	        });
	        var result = {"totalExpense": totalExpense, "totalTime": totalTime};
	        resolve(result);
	      }).catch(function(resObject){
	        console.error('Error from readRecords', angular.toJson(resObject));
	        reject(resObject);
	      });
	    });
	  }

  }

})();