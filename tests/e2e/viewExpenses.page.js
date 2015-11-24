/**
 * Page Object Definition
 * ViewExpenses page
 */

var ViewExpenses = function() {
};

ViewExpenses.prototype = Object.create({}, {

  expensesList: {get: function(){
    return element.all(by.collRepeater('record in expenses'));
  }},

});

module.exports = new ViewExpenses();