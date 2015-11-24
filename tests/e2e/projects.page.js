/**
 * Page Object Definition
 * Projects page
 */

var ProjectsPage = function() {
};

ProjectsPage.prototype = Object.create({}, {

  projectsList: {get: function(){
    return element.all(by.collRepeater('project in projects'));
  }},

  clearSearch: {value: function(){
  	return element(by.css('.search-clear-button')).click();
  }},

  search: {value: function(input){
  	return element(by.model('search.query')).sendKeys(input);
  }}

});

module.exports = new ProjectsPage();