
// N E T W O R K    S E R V I C E

describe('NetworkService Unit Tests', function(){
  beforeEach(module('starter.services'));

  beforeEach(inject(function (_$rootScope_, _NetworkService_) {
    NetworkService = _NetworkService_;
    $rootScope = _$rootScope_;

    localStorage.removeItem('networkStatus');
  }));

  it('should set localStorage["networkStatus"] to offline', function(){
    NetworkService.networkEvent('offline');
    expect(localStorage['networkStatus']).toBe("offline");
  });


  it('should set localStorage["networkStatus"] to online and not sync', function(){
    localStorage.setItem('networkStatus', 'online');
    NetworkService.networkEvent('online');
    expect(localStorage['networkStatus']).toBe("online");
  });

});

// P R O J E C T    S E R V I C E
describe('ProjectService Unit Tests', function(){

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
    ]

  beforeEach(module('starter.services'));

  beforeEach(inject(function (_$rootScope_, _ProjectService_) {
    ProjectService = _ProjectService_;
    $rootScope = _$rootScope_;


    var devUtils = mobileCaddy.require('mobileCaddy/devUtils');
    devUtils.setresponse('readRecords', {records: myProjects}, 'MC_Project__ap');
    devUtils.setresponse('readRecords', {records: myLocations}, 'MC_Project__Location__ap');
    devUtils.setresponse('readRecords', {records: myExpenses}, 'MC_Time_Expense__ap');

    $rootScope.projects = myProjects;

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
