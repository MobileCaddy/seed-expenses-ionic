
// P R O J E C T    S E R V I C E
describe('ProjectService Unit Tests', function(){

  var utilsMock;

  beforeEach(module('starter.services'));

  beforeEach(function() {
      utilsMock = jasmine.createSpyObj('devUtils', ['syncMobileTable', 'readRecords']);

      module(function($provide) {
          $provide.value('devUtils', utilsMock);
      });
  });


  /* S U C C E S S
   * @describe Checks when we have some Projects defined
   */
  describe('Projects Service success', function(){
    var myProjects = [
      {
        "Id" : "0011100000g0Fe9AAE",
        "Name" : "Project 1",
        "mobilecaddy1__Description__c" : "desc1",
        "mobilecaddy1__MC_Project_Location__c" : "a2zR0000000NaqSIAS"
      },
      {
        "Id" : "0011100000hkruTAAQ",
        "Name" : "Project 2",
        "mobilecaddy1__Description__c" : "desc2",
        "mobilecaddy1__MC_Project_Location__c" : "a2zR0000000NaudIAC"
      },
      {
        "Id" : "0011100000hks4iAAA",
        "Name" : "Project 3",
        "mobilecaddy1__Description__c" : "desc3",
        "mobilecaddy1__MC_Project_Location__c" : "a2zR0000000NaqSIAS"
      }
    ];

    var myLocations = [
      {"Id" : "a2zR0000000NaqSIAS","Name" : "Office"},
      {"Id" : "a2zR0000000NaudIAC","Name" : "Client"}
    ];

    var myExpenses = [
      {
        "Approved__c" : "Awaiting",
        "mobilecaddy1__Project__c" : "0011100000g0Fe9AAE",
        "mobilecaddy1__Duration_Minutes__c" : 30,
        "mobilecaddy1__Expense_Amount__c" : null,
        "mobilecaddy1__Short_Description__c" : "Time 1",
        "Name" : "TAE-005686"
      },
      {
        "Approved__c" : "Awaiting",
        "mobilecaddy1__Project__c" : "0011100000g0Fe9AAE",
        "mobilecaddy1__Duration_Minutes__c" : null,
        "mobilecaddy1__Expense_Amount__c" : 10,
        "mobilecaddy1__Short_Description__c" : "Expense 1",
        "Name" : "TAE-005687"
      },
      {
        "Approved__c" : "Awaiting",
        "mobilecaddy1__Project__c" : "0011100000g0Fe9AAE",
        "mobilecaddy1__Duration_Minutes__c" : null,
        "mobilecaddy1__Expense_Amount__c" : 20,
        "mobilecaddy1__Short_Description__c" : "Expense 2",
        "Name" : "TAE-005688"
      }
    ];

    beforeEach(inject(function (_$rootScope_, _ProjectService_) {
      ProjectService = _ProjectService_;
      $rootScope = _$rootScope_;

      // mock of devUtils.readRecords
      utilsMock.readRecords.and.callFake(function(table){
        return new Promise(function(resolve, reject) {
          switch (table) {
            case 'MC_Project__ap' :
              resolve({records: myProjects});
              break;
            case 'MC_Time_Expense__ap' :
              resolve({records: myExpenses});
              break;
            case 'MC_Project_Location__ap' :
              resolve({records: myLocations});
              break;
          }
        });
      });

      // mock of syncMobileTable
      // always return 2nd item
      utilsMock.syncMobileTable.and.callFake(function(){
        return new Promise(function(resolve, reject) {
          resolve('ok');
        });
      });

    }));

    /*
     ProjectService.all()
     */
    it('should fetch all projects', function(done) {

      var testProjects = function(res) {
        expect(res.length).toBe(3);
        done();
      };

      ProjectService.all(false)
        .then(testProjects);
    });

    it('should fetch all projects and return to callback', function(done) {

     var testProjects1 = function(res) {
        expect(res.length).toBe(3);
      };


      var testProjects = function(res) {
        expect(res.length).toBe(3);
        done();
      };

      ProjectService.all(false, testProjects1)
        .then(testProjects);
    });

    /*
     ProjectService.get()
     */
    it('should get project by ID', function() {
      $rootScope.projects = myProjects;
      var res = ProjectService.get('0011100000g0Fe9AAE');
      expect(res.Id).toBe('0011100000g0Fe9AAE');
      expect(res.Name).toBe('Project 1');
    });

    it('should fail to get project by ID', function() {
      var res = ProjectService.get('123');
      expect(res).toBe(undefined);
    });

    /*
     ProjectService.expenses()
     */
    it('should fetch all time expenses for a project', function(done) {

      var testExpenses = function(res) {
        expect(res.length).toBe(1);
        done();
      };

      ProjectService.expenses('time', '0011100000g0Fe9AAE')
        .then(testExpenses);
    });

    it('should fetch all money expenses for a project', function(done) {

      var testExpenses = function(res) {
        expect(res.length).toBe(2);
        done();
      };

      ProjectService.expenses('expense', '0011100000g0Fe9AAE')
        .then(testExpenses);
    });

    it('should fetch no expenses for a project', function(done) {

      var testExpenses = function(res) {
        expect(res.length).toBe(0);
        done();
      };

      ProjectService.expenses('expense', '123')
        .then(testExpenses);
    });

  });
});
