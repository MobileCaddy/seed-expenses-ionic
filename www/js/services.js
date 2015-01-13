var underscore = angular.module('underscore', []);
  underscore.factory('_', function() {
    return window._; // assumes underscore has already been loaded on the page
  });

angular.module('starter.services', ['underscore'])

.factory('ProjectService', function($rootScope, $q, _) {
  var devUtils        = mobileCaddy.require('mobileCaddy/devUtils');

  var startupTables = ['MC_Project_Location__ap', 'MC_Time_Expense__ap'];
  var recTypeIdTime = "012R00000009BycIAE";
  var recTypeIdExp  = "012R00000009ByhIAE";

  var projects = [];
  var project = null;

  /**
   * syncStartupTables - syncs tables, doesn't really care about the result
   * @return true
   */
  function syncStartupTables (refreshFlag) {
    var myStartupTables = refreshFlag ? startupTables : ['MC_Time_Expense__ap'] ;
    var sequence = Promise.resolve();
    myStartupTables.forEach(function(table){
      console.log('Angular: syncStartupTables -> ' + table, refreshFlag);
      sequence = sequence.then(function() {
        return devUtils.syncMobileTable(table, refreshFlag);
      }).then(function(resObject) {
        console.log('Angular : Success from syncMobileTable -> ' + angular.toJson(resObject));
      });
    });
    return true;
  }

  function getProjectsFromSmartStore(action) {
    var deferred = $q.defer();
    devUtils.readRecords('MC_Project__ap', []).then(function(resObject) {
      records = resObject.records;
      var projects = [];
      //console.log('Angular: getRecordsFromSmartStore records ->' + angular.toJson(records));
      console.log('Angular: getRecordsFromSmartStore');
      projects = records;
      //console.log('Angular: projects->' + angular.toJson(projects));
      console.log('Angular: projects');
      $rootScope.$broadcast('scroll.refreshComplete');
      switch (action) {
        case 'back' : window.history.back();
          break;
        default : console.log('Angular: getProjectsFromSmartStore, non-handled action');
      }
      deferred.resolve(projects);
    }).catch(function(resObject){
      console.log('Angular : Error from querySoupRecords -> ' + angular.toJson(resObject));
      deferred.reject('error');
    });
  return deferred.promise;
  }

  function getProjects(refreshFlag, localProjCB) {
    var firstStartUp = (typeof $rootScope.firstStartUp == 'undefined' || $rootScope.firstStartUp === true);
    var deferred = $q.defer();
    console.log('Angular: getProjects, firstStartUp ->' + firstStartUp);
    if (refreshFlag || firstStartUp) {
      projects = [];
      if (typeof(localProjCB) != "undefined") {
        // get localprojects if they exist and return through callback
        getProjectsFromSmartStore('undefined')
          .then(function(projects) {
            localProjCB(projects);
        });
      }
      devUtils.syncMobileTable('MC_Project__ap').then(function(resObject){
        console.log('Angular : Success from syncMobileTable -> ' + angular.toJson(resObject));
        getProjectsFromSmartStore('undefined')
          .then(function(projects) {
            deferred.resolve(projects);
            //if (firstStartUp) {
              syncStartupTables(!refreshFlag);
            //}
        }, function(reason) {
          console.error("Angular: promise returned reason -> " + reason);
          deferred.reject('error');
        });
      }).catch(function(resObject){
          console.error('Angular : Error from syncMobileTable -> ' + angular.toJson(resObject));
          deferred.reject('error');
      });
    } else {
      // tmp line to set local projects
      projects = $rootScope.projects;
      getProjectsFromSmartStore('undefined')
        .then(function(projects) {
        deferred.resolve(projects);
      }, function(reason) {
        console.error("Angular: promise returned reason -> " + reason);
        deferred.reject('error');
      });
    }
    $rootScope.firstStartUp = false;
    return deferred.promise;
  }

  var locations = [];

  function getLocationFromId(locationId) {
    console.log('Angular: locationId->' + locationId);
    var location =  _.where(locations, {'Id': locationId});
    if (typeof location[0]!= 'undefined') {
      console.log('Angular: location->' + location[0].Name);
      return location[0].Name;
    } else {
      console.log('Angular: no location yet');
      return '-';
    }
  }

  function getLocations(locationId) {
    console.log('Angular: getLocations');
    devUtils.readRecords('MC_Project_Location__ap', []).then(function(resObject) {
      records = resObject.records;
      $j.each(records, function(i,record) {
        locations.push(record);
      });
      console.log('Angular: ' + angular.toJson(locations));
      if (locationId != "dummy") {
        $rootScope.$apply(function(){
          project.location = getLocationFromId(locationId);
          this.project = project;
        });
      }
      return locations;
    }).catch(function(resObject){
      console.error('Angular : Error from syncMobileTable MC_Project_Location__ap -> ' + angular.toJson(resObject));
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
    console.log('Angular: getTimeExpense');
    var timeExpense = [];
    var deferred = $q.defer();
    devUtils.readRecords('MC_Time_Expense__ap', []).then(function(resObject) {
      records = resObject.records;
      $j.each(records, function(i,record) {
        timeExpense.push(record);
      });
      console.log('Angular: timeExpense' + angular.toJson(timeExpense));
      console.log('Angular: projectId' + projectId);
      var timeExpense1 =  [];
      if ( type == "time") {
        timeExpense1 = timeExpense.filter(function(el){
          return el.mc_package_002__Duration_Minutes__c !== null &&
            el.mc_package_002__Project__c == projectId;
        });
        } else {
        timeExpense1 = timeExpense.filter(function(el){
          return (el.mc_package_002__Expense_Amount__c !== null && typeof(el.mc_package_002__Expense_Amount__c) != "undefined" ) &&
            el.mc_package_002__Project__c == projectId;
        });
        }

      console.log('Angular: timeExpense1' + angular.toJson(timeExpense1));
      deferred.resolve(timeExpense1);
    }).catch(function(resObject){
      console.error('Angular : Error from syncMobileTable MC_Project_Location__ap -> ' + angular.toJson(resObject));
      deferred.reject('error');
    });
    return deferred.promise;
  }

  return {
    all: function(refreshFlag, localProjCB) {
      console.log('Angular: refreshFlag = ' + refreshFlag);
      return  getProjects(refreshFlag, localProjCB);
    },
    get: function(projectId) {
      console.log('Angular: projects->' + angular.toJson($rootScope.projects));
      var ProjectArr =  _.where($rootScope.projects, {'Id': projectId});
      console.log('Angular: project->' + project);
      project = ProjectArr[0];
      if(typeof ProjectArr[0].mc_package_002__MC_Project_Location__c != 'undefined') {
        if (locations.length <= 0) {
          locations =  getLocations(ProjectArr[0].mc_package_002__MC_Project_Location__c);
        }
        ProjectArr[0].location =  getLocationFromId(ProjectArr[0].mc_package_002__MC_Project_Location__c);
      } else {
        console.log('Angular: no mc_package_002__MC_Project_Location__c in project');
        ProjectArr[0].location = '-';
      }
      return project;
    },
    update: function(project) {
      var deferred = $q.defer();
      var tmpProject = angular.copy(project);
      tmpProject.SystemModstamp = new Date().getTime();
      devUtils.updateRecord('MC_Project__ap',tmpProject, 'Id').then(function(retObject) {
        console.log('Angular: update, retObject -> ' + angular.toJson(retObject));
        deferred.resolve(retObject);
      }).catch(function(returnErr) {
        console.error('Angular: update,  returnErr ->' + angular.toJson(returnErr));
        deferred.reject(returnErr);
      });
      return deferred.promise;
    },
    expenses: function(type, projectId) {
      console.log('Angular: getProject, type=' + type + ', Id=' + projectId);
      return  getTimeExpense(type, projectId);
    },
    newExpense: function(varNewExp, success, error) {
      console.log('Angular: newExpense -> ' + angular.toJson(varNewExp));
      devUtils.insertRecord('MC_Time_Expense__ap',varNewExp).then(function(res) {
        console.log('Angular: newExpense,  res -> ' + angular.toJson(res));
        success(res);
        // perform background sync - we're not worried about Promise resp.
        devUtils.syncMobileTable('MC_Time_Expense__ap');
      }).catch(function(e) {
        console.log('Angular: newExpense,  error=' + e);
        error(e);
      });
    }
  };
})


  /*
  ===========================================================================
    M O B I L C A D D Y     S E T T I N G S
  ===========================================================================
  */

.factory('DevService', function($rootScope, $q, _) {
  var smartStoreUtils = mobileCaddy.require('mobileCaddy/smartStoreUtils');
  var devUtils        = mobileCaddy.require('mobileCaddy/devUtils');

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
        console.log('MC: error from listMobileTables -> ' + angular.toJson(e));
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

})


.factory('DeployService', function($rootScope, $q, $timeout, $http) {

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
          console.debug('response' , response);
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
          console.debug('response' , response);
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
        console.debug('resource exists... patching existing');
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
              console.debug('response' , response);
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
            console.debug('response' , response);
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
              console.debug('page exists... patching existing');
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
});
