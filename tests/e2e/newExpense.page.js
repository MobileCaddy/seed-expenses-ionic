/**
 * Page Object Definition
 * NewExpense page
 */

var NewExpense = function() {
};

NewExpense.prototype = Object.create({}, {

  expenseValue: {get: function(){
    return element(by.model('expenseValue'));
  }},

  description: {get: function(){
    return element(by.model('description'));
  }},

  submitBtn: {get: function(){
    return element(by.css('.submit-expense'));
  }},

  cancelBtn: {get: function(){
    return element(by.css('.ion-close'));
  }},

});

module.exports = new NewExpense();