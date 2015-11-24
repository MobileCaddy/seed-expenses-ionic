/**
 * Page Object Definition
 * ProjectDetailsPage page
 */

var ProjectDetailsPage = function() {
};

ProjectDetailsPage.prototype = Object.create({}, {

  description: {get: function(){
    return element(by.model('project.formDescription')).getAttribute('value');
  }},

  location: {get: function(){
  	return element(by.binding('project.location')).getText();
  }},

  newTimeBtn: {get: function(){
    return element(by.id('new-time'));
  }},

  viewExpRecs: {get: function(){
  	return element(by.id('view-exp-recs'));
  }},

  viewTimeRecs: {get: function(){
  	return element(by.id('view-time-recs'));
  }}
});

module.exports = new ProjectDetailsPage();