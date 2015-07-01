angular.module('underscore', [])
  .factory('_', function() {
    return window._; // assumes underscore has already been loaded on the page
});

angular.module('devUtils', [])
  .factory('devUtils', function() {
    return mobileCaddy.require('mobileCaddy/devUtils');
});

angular.module('vsnUtils', [])
  .factory('vsnUtils', function() {
    return mobileCaddy.require('mobileCaddy/vsnUtils');
});

angular.module('smartStoreUtils', [])
  .factory('smartStoreUtils', function() {
    return mobileCaddy.require('mobileCaddy/smartStoreUtils');
});

angular.module('starter.services', ['underscore', 'devUtils', 'vsnUtils', 'smartStoreUtils'])

/*
 * handles network events (online/offline) and kicks off tasks if needed
 */
.factory('NetworkService', ['SyncService', function(SyncService){
  return {
    networkEvent: function(status){
      var pastStatus = localStorage.getItem('networkStatus');
      if (status == "online" && pastStatus != status) {
        SyncService.syncTables(['MC_Project__ap', 'MC_Time_Expense__ap'], true);
      }
      localStorage.setItem('networkStatus', status);
      return true;
    }
  };
}])


/*
 * Collects 'resume' event and checks if there's an upgrade available. If so
 *  then ask the user if they want to upgrade. If not then refrain from
 *  asking again for a period if time.
 */
.factory('AppRunStatusService', ['$ionicPopup', '$ionicLoading', 'devUtils', 'vsnUtils', 'SyncService', function($ionicPopup, $ionicLoading, devUtils, vsnUtils, SyncService) {

  function resume() {
    devUtils.dirtyTables().then(function(tables){
      //console.log('AppRunStatusService resume tables',tables);
      if (tables && tables.length === 0) {
        vsnUtils.upgradeAvailable().then(function(res){
          //console.log('AppRunStatusService upgradeAvailable?',res);
          if (res) {
            var notificationTimeout = (1000 * 60 * 5); // 5 minutes
            var prevUpNotification = localStorage.getItem('prevUpNotification');
            var timeNow = Date.now();
            if (prevUpNotification === null) {
              prevUpNotification = 0;
            }
            if (parseInt(prevUpNotification) < (timeNow - notificationTimeout)){
              var confirmPopup = $ionicPopup.confirm({
                title: 'Upgrade available',
                template: 'Would you like to upgrade now?',
                cancelText: 'Not just now',
                okText: 'Yes'
              });
              confirmPopup.then(function(res) {
                if(res) {
                  $ionicLoading.show({
                    duration: 30000,
                    delay : 400,
                    maxWidth: 600,
                    noBackdrop: true,
                    template: '<h1>Upgrade app...</h1><p id="app-upgrade-msg" class="item-icon-left">Upgrading...<ion-spinner/></p>'
                  });
                  localStorage.removeItem('prevUpNotification');
                  vsnUtils.upgradeIfAvailable().then(function(res){
                    //console.log('upgradeIfAvailable', res);
                  }).catch(function(e){
                    console.error(e);
                    $ionicLoading.hide();
                  });
                } else {
                  localStorage.setItem('prevUpNotification', timeNow);
                }
              });
            }
          }
        });
      } else {
        SyncService.syncTables(['MC_Project__ap', 'MC_Time_Expense__ap', 'MC_Project_Location__ap'], true);
      }
    });
    return true;
  }

  return {
    statusEvent: function(status){
      //console.log('AppRunStatusService statusEvent', status);
      if (status == "resume") {
        resume();
      }
    }
  };
}])

  /*
  ===========================================================================
    S Y N C    S E R V I C E
  ===========================================================================
  */

.factory('SyncService', ['devUtils', function(devUtils){

  function  syncTables(tablesToSync, syncWithoutLocalUpdates, maxTableAge) {
    if (typeof(maxTableAge) == "undefined") {
      maxTableAge = (1000 * 60 * 3); // 3 minutes
    }
    //console.log('syncTables maxTableAge', maxTableAge, syncWithoutLocalUpdates);

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
        }
        firstSync = false;
      }).catch(function(res){
        if (typeof(res.status) != "undefined" &&
             (res.status == "100497" ||
              res.status == "100498" ||
              res.status == "100402")) {
          //console.log(res);
        } else {
          console.error(res);
        }
        //NotificationService.setLocalNotification();
      });
    });
  }

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
    getSyncState: function(){
      var syncState = localStorage.getItem("syncState");
      if (syncState === null) {
        syncState = "Complete";
        localStorage.setItem("syncState", syncState);
      }
      //console.log("mc getSyncState syncState", syncState);
      return syncState;
    },
    setSyncState: function(status){
      localStorage.setItem("syncState", status);
      //console.log("mc setSyncState", "syncState", status);
    },
    syncTables: function(tabs2Sync, syncWithoutLocalUpdates, maxTableAge) {
      syncTables(tabs2Sync, syncWithoutLocalUpdates, maxTableAge);
    }
  };
}])

.factory('ProjectService', ['$rootScope', '$q', '_', 'devUtils', 'SyncService', function($rootScope, $q, _, devUtils, SyncService) {

  var recTypeIdTime = "012R00000009BycIAE";
  var recTypeIdExp  = "012R00000009ByhIAE";

  var projects = [];
  var project = null;

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
        // Sync table used in list (smart store is then populated)
        devUtils.syncMobileTable('MC_Project__ap', true).then(function(resObject){
          //console.log('Angular : Success from syncMobileTable -> ' + angular.toJson(resObject));
          getProjectsFromSmartStore().then(function(projects) {
              resolve(projects);
              // Make sure we can carry on with background syncing other tables
              if (typeof(resObject.status) != "undefined" && resObject.status != "100400") {
                // Couldn't sync MC_Project__ap
              } else {
                SyncService.syncTables(['MC_Project_Location__ap', 'MC_Time_Expense__ap'], true);
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

  var locations = [];

  function getLocationFromId(locationId) {
    //console.log('Angular: locationId->' + locationId);
    var location =  _.where(locations, {'Id': locationId});
    if (typeof location[0]!= 'undefined') {
      //console.log('Angular: location->' + location[0].Name);
      return location[0].Name;
    } else {
      //console.log('Angular: no location yet');
      return '-';
    }
  }

  function getLocations(locationId) {
    //console.log('Angular: getLocations');
    devUtils.readRecords('MC_Project_Location__ap', []).then(function(resObject) {
      records = resObject.records;
      $j.each(records, function(i,record) {
        locations.push(record);
      });
      //console.log('Angular: ' + angular.toJson(locations));
      if (locationId != "dummy") {
        $rootScope.$apply(function(){
          project.location = getLocationFromId(locationId);
          this.project = project;
        });
      }
      return locations;
    }).catch(function(resObject){
      console.error('Angular : Error from readRecords MC_Project_Location__ap -> ' + angular.toJson(resObject));
      deferred.reject('error');
    });
    return locations;
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
        records = resObject.records;
        $j.each(records, function(i,record) {
          timeExpense.push(record);
        });
        //console.log('Angular: timeExpense' + angular.toJson(timeExpense));
        //console.log('Angular: projectId' + projectId);
        var timeExpense1 =  [];
        if (type == "time") {
          timeExpense1 = timeExpense.filter(function(el){
            return (el.mc_package_002__Duration_Minutes__c !== null &&
                    typeof(el.mc_package_002__Duration_Minutes__c) != "undefined") &&
                    el.mc_package_002__Project__c == projectId;
          });
        } else {
          timeExpense1 = timeExpense.filter(function(el){
            return (el.mc_package_002__Expense_Amount__c !== null &&
                    typeof(el.mc_package_002__Expense_Amount__c) != "undefined") &&
                    el.mc_package_002__Project__c == projectId;
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
        var records = _.where(resObject.records, {'mc_package_002__Project__c': projectId});
        //console.log('Angular: getProjectTotals',records);
        _.each(records, function(el) {
          if (el.mc_package_002__Duration_Minutes__c !== null &&
              typeof(el.mc_package_002__Duration_Minutes__c) != "undefined") {
            totalTime += el.mc_package_002__Duration_Minutes__c;
          } else {
            if (el.mc_package_002__Expense_Amount__c !== null &&
                typeof(el.mc_package_002__Expense_Amount__c) != "undefined") {
              totalExpense += el.mc_package_002__Expense_Amount__c;
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

  return {
    all: function(refreshFlag, localProjCB) {
      //console.log('Angular: refreshFlag = ' + refreshFlag);
      return  getProjects(refreshFlag, localProjCB);
    },
    get: function(projectId) {
      //console.log('Angular: projects->' + angular.toJson($rootScope.projects));
      var ProjectArr =  _.where($rootScope.projects, {'Id': projectId});
      project = ProjectArr[0];
      //console.log('Angular: project -> ', project);
      if (typeof(project) != "undefined") {
        project = ProjectArr[0];
        if(typeof ProjectArr[0].mc_package_002__MC_Project_Location__c != 'undefined') {
          if (locations.length <= 0) {
            locations =  getLocations(ProjectArr[0].mc_package_002__MC_Project_Location__c);
          }
          ProjectArr[0].location =  getLocationFromId(ProjectArr[0].mc_package_002__MC_Project_Location__c);
        } else {
          //console.log('Angular: no mc_package_002__MC_Project_Location__c in project');
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
    expenses: function(type, projectId) {
      //console.log('Angular: expenses, type=' + type + ', Id=' + projectId);
      return  getTimeExpense(type, projectId);
    },
    newExpense: function(varNewExp, success, error) {
      //console.log('Angular: newExpense -> ' + angular.toJson(varNewExp));
      devUtils.insertRecord('MC_Time_Expense__ap',varNewExp).then(function(res) {
        //console.log('Angular: newExpense,  res -> ' + angular.toJson(res));
        success(res);
        // perform background sync
        SyncService.syncTables(['MC_Time_Expense__ap'], true);
      }).catch(function(e) {
        //console.log('Angular: newExpense,  error=' + e);
        error(e);
      });
    },
    getProjectTotals: function(projectId) {
      return getProjectTotals(projectId);
    }
  };
}])


  /*
  ===========================================================================
    M O B I L C A D D Y     S E T T I N G S
  ===========================================================================
  */

.factory('DevService', ['$rootScope', '$q', '_', 'devUtils', 'smartStoreUtils', function($rootScope, $q, _, devUtils, smartStoreUtils) {

  function getTables() {
    var deferred = $q.defer();
    var tables = [];

    // Add other system tables
    tables.push({'Name' : 'syncLib_system_data'});
    tables.push({'Name' : 'appSoup'});
    tables.push({'Name' : 'cacheSoup'});
    tables.push({'Name' : 'recsToSync'});
    smartStoreUtils.listMobileTables(
      smartStoreUtils.ALPHA,
      // Success callback
      function(tableNames) {
          $j.each(tableNames, function(i,tableName) {
            tables.push({'Name' : tableName});
            smartStoreUtils.getTableDefnColumnValue(
              tableName,
              'Snapshot Data Required',
              function(snapshotValue) {
                // Create the snapshot table too, if required
                if (snapshotValue == 'Yes') {
                  tables.push({'Name' : 'SnapShot_' + tableName});
                } else {
                }
                $rootScope.$apply(function(){
                  this.tables = tables;
                });
                return tables;
              }, // end success callback
              function(resObject){
                console.error('MC : Error from listMobileTables -> ' + angular.toJson(resObject));
                deferred.reject('error');
              });
          });

          $rootScope.$apply(function(){
            deferred.resolve(tables);
            });
          return deferred.promise;
        },
      function(e) {
        //console.log(': error from listMobileTables -> ' + angular.toJson(e));
        deferred.reject(e);
      });
    return deferred.promise;
  }


 /**
  * Works out if Val is likely an ID based on it's format
  * @param {string} Val
  * @return {boolean}
  */
  function isId(Val) {
    var patt = /^[a-zA-Z0-9]{18}$/;
    return patt.test(Val);
  }


  function getRecords(tableName, refreshFlag) {
    var deferred = $q.defer();
    var myTableRecs = [];
    devUtils.readRecords(tableName, []).then(function(resObject) {
      records = resObject.records;
      $j.each(records, function(i,record) {
        var tableRec = [];
        for (var fieldDef in record) {
          var field = {
            'Name' : fieldDef,
            'Value' : record[fieldDef],
            'ID_flag' : isId(record[fieldDef])};
          tableRec.push(field);
        } // end loop through the object fields
        myTableRecs.push(tableRec);
      });
      deferred.resolve(myTableRecs);
    }).catch(function(resObject){
      console.error('MC : Error from devUtils.readRecords -> ' + angular.toJson(resObject));
      deferred.reject('error');
    });
    return deferred.promise;
  }

  return {
    allTables: function() {
      return getTables();
    },
    allRecords: function(tableName,refreshFlag) {
      switch (refreshFlag) {
        case true :
          tableRecs = [];
          tableRecs = getRecords(tableName, true);
          break;
        default :
          if ((typeof tableRecs == 'undefined') || (tableRecs.length < 1)) {
            tableRecs = [];
            tableRecs = getRecords(tableName, true);
          } else {
            tableRecs = [];
            tableRecs = getRecords(tableName, false);
          }
      }
      return tableRecs;
    }
  };

}])


.factory('DeployService', ['$rootScope', '$q', '$timeout', '$http', function($rootScope, $q, $timeout, $http) {

  var apiVersion = "v32.0";

  function _arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
  }

  /**
   * Does the static resource already exist on the platform for this app/vsn
   */
  function doesBundleExist(appConfig){
    return new Promise(function(resolve, reject) {
    var dataName = appConfig.sf_app_name + '_' + appConfig.sf_app_vsn;
    // check if statid resource already exists
    force.request(
      {
        path: '/services/data/' + apiVersion + '/tooling/query/?q=select Id, Name, Description, LastModifiedDate from StaticResource WHERE Name=\'' + dataName + '\' LIMIT 1'
      },
      function(response) {
          //console.log('response' , response);
          resolve(response);
      },
      function(error) {
        console.error('Failed to check if app bundle already existed on platform');
        reject({message :"App bundle upload failed. See console for details.", type: 'error'});
      });
    });
  }

  /**
   * Does the static resource already exist on the platform for this app/vsn
   */
  function doesPageExist(pageName){
    return new Promise(function(resolve, reject) {
    // check if statid resource already exists
    force.request(
      {
        path: '/services/data/' + apiVersion + '/tooling/query/?q=select Id, Name, Description, LastModifiedDate from ApexPage WHERE Name=\'' + pageName + '\' LIMIT 1'
      },
      function(response) {
          //console.log('response' , response);
          resolve(response);
      },
      function(error) {
        console.error('Failed to check if page already existed on platform');
        reject({message :"Page upload failed. See console for details.", type: 'error'});
      });
    });
  }

  function getDetails () {
    return new Promise(function(resolve, reject) {
    var details = {};
    $timeout(function() {
        $http.get('../package.json').success(function(appConfig) {
          appConfig.sf_app_vsn = appConfig.version.replace(/\./g, '');
          resolve(appConfig);
        }).catch(function(err){
          console.error(err);
        });
    }, 30);
    });
  }

  function encodeAppBundle(appConfig){
    return new Promise(function(resolve, reject) {

      JSZipUtils.getBinaryContent('../' + appConfig.name + '-' + appConfig.version +'.zip', function(err, data) {
        if(err) {
          console.error(err);
          reject(err); // or handle err
        }
        var zipFileLoaded = new JSZip(data);
        $rootScope.deployFiles = zipFileLoaded.files;
        resolve(_arrayBufferToBase64(data));
      });
    });
  }

  function uploadAppBundle (appConfig, myBody) {
    return new Promise(function(resolve, reject) {
    var dataName = appConfig.sf_app_name + '_' + appConfig.sf_app_vsn;
    doesBundleExist(appConfig).then(function(response){
      if (response.records.length > 0) {
        // Update existing resource
        //console.log('resource exists... patching existing');
        var existingSR = response.records[0];
        force.request(
          {
            method: 'PATCH',
            contentType: 'application/json',
            path: '/services/data/' + apiVersion + '/tooling/sobjects/StaticResource/' + existingSR.Id + '/',
            data: {
              'Body':myBody
            }
          },
          function(response) {
              //console.log('response' , response);
              resolve('Existing app bundle updated');
          },
          function(error) {
            console.error('Failed to check if app bundle already existed on platform');
            reject({message :"App bundle upload failed. See console for details.", type: 'error'});
          }
        );
      } else {
        // Updload new resource
        force.request(
          {
            method: 'POST',
            contentType: 'application/json',
            path: '/services/data/' + apiVersion + '/tooling/sobjects/StaticResource/',
            data: {
              'Name': dataName,
              'Description' : 'App Bundle - auto-uploaded by MobileCaddy delopyment tooling',
              'ContentType':'application/zip',
              'Body':myBody,
              'CacheControl': 'Public'
            }
          },
          function(response) {
            //console.log('response' , response);
            resolve('App bundle uploaded');
          },
          function(error) {
            console.error(error);
            reject({message :"App bundle upload failed. See console for details.", type: 'error'});
          });
      }
    });
    });
  }

  function uploadCachePage(appConfig) {
    return new Promise(function(resolve, reject) {
      $timeout(function() {
        $http.get('../apex-templates/cachepage-template.apex').success(function(data) {
          var dataName = appConfig.sf_app_name + 'Cache_' + appConfig.sf_app_vsn;
          var cacheEntriesStr = '';
          _.each($rootScope.deployFiles, function(el){
            if (!el.dir) cacheEntriesStr += '{!URLFOR($Resource.' + appConfig.sf_app_name + '_' + appConfig.sf_app_vsn + ', \'' + el.name + '\')}\n';
          });
          var dataParsed = data.replace(/MC_UTILS_RESOURCE/g, appConfig.mc_utils_resource);
          dataParsed = dataParsed.replace(/MY_APP_FILE_LIST/g, cacheEntriesStr);
          delete $rootScope.deployFiles;

          doesPageExist(dataName).then(function(response){
            if (response.records.length > 0) {
               // Update existing resource
              //console.log('page exists... patching existing');
              var existingPage = response.records[0];
              force.request(
                {
                  method: 'PATCH',
                  contentType: 'application/json',
                  path: '/services/data/' + apiVersion + '/tooling/sobjects/ApexPage/' + existingPage.Id + '/',
                  data: {
                    'Markup' : dataParsed
                  },
                },
                function(response) {
                  resolve('Existing Cache manifest updated');
                },
                function(error) {
                  console.error(error);
                  reject({message :'Cache manifest upload failed. See console for details.', type: 'error'});
                }
              );
            } else {
              force.request(
                {
                  method: 'POST',
                  contentType: 'application/json',
                  path: '/services/data/' + apiVersion + '/tooling/sobjects/ApexPage/',
                  data: {
                    'Name': dataName,
                    'MasterLabel': dataName,
                    'Markup' : dataParsed
                  }
                },
                function(response) {
                  resolve('Cache manifest uploaded');
                },
                function(error) {
                  console.error(error);
                  reject({message :'Cache manifest upload failed. See console for details.', type: 'error'});
                }
              );
            }
        });
      }, 30);
    });
    });
  }


  function uploadStartPage(appConfig) {
    return new Promise(function(resolve, reject) {
      $timeout(function() {
        $http.get('../apex-templates/startpage-template.apex').success(function(data) {
          var dataName = appConfig.sf_app_name + '_' + appConfig.sf_app_vsn;
          var dataParsed = data.replace(/MC_UTILS_RESOURCE/g, appConfig.mc_utils_resource);
          dataParsed = dataParsed.replace(/MY_APP_RESOURCE/g, appConfig.sf_app_name + '_' + appConfig.sf_app_vsn);
          dataParsed = dataParsed.replace(/MY_APP_CACHE_RESOURCE/g, appConfig.sf_app_name + 'Cache_' + appConfig.sf_app_vsn);
          force.request(
            {
              method: 'POST',
              contentType: 'application/json',
              path: '/services/data/' + apiVersion + '/tooling/sobjects/ApexPage/',
              data: {
                'Name': dataName,
                'ControllerType' : '3',
                'MasterLabel': dataName,
                'Markup' : dataParsed
              }
            },
            function(response) {
              resolve('Start page uploaded');
            },
            function(error) {
              console.error(error);
              doesPageExist(dataName).then(function(response){
                if (response.records.length > 0) {
                  reject({message :'Start page already exists. Not updated.', type : 'info'});
                } else {
                  reject({message :'Start page upload failed. See console for details.', type: 'error'});
                }
              });
            }
          );
        });
      }, 30);
    });
  }

  return {
    getDetails : function() {
      return getDetails();
    },
    deployBunlde : function(appConfig){
      return encodeAppBundle(appConfig).then(function(myBody, bundleFiles){
        return uploadAppBundle(appConfig, myBody);
      });
    },
    uploadCachePage : function(appConfig){
      return uploadCachePage(appConfig);
    },
    uploadStartPage : function(appConfig){
      return uploadStartPage(appConfig);
    },
    srDetails: function() {
      return encodeAppBundle().then(function(myBody){
        return uploadAppBundle(myBody);
      }).then(function(res){
        return uploadStartPage();
      });
    }
  };
}]);
