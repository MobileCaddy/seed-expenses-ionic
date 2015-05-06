describe('Controllers', function(){
  var scope,
  	mockProjectService;

  // load the controller's module
  beforeEach(module('starter.controllers'));

  // set up mock services
  beforeEach(function() {
    mockProjectService = {

    };

    module(function($provide) {
	    $provide.value('ProjectService', mockProjectService);			  });

  });

  beforeEach(inject(function($rootScope, $controller) {
    scope = $rootScope.$new();
    $controller('ProjectExpNewCtrl', {$scope: scope});
  }));


  // tests start here
  it('submitForm', function(){
    expect(typeof(scope.submitForm)).toEqual('function');
  });
});