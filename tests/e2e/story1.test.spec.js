/*
  Title: Story 1
  Story:
  # List projects
  # View a particular project
  # Look at time expenses
  # Look at expenses entries
  # Start creating a cancel an expense
  # Create and submit new expense
  # View it in expenses list
 */
describe("Story1:", function() {

	var projects       = require('./projects.page.js');
	var projectDetails = require('./projectDetails.page.js');
	var viewExpenses   = require('./viewExpenses.page.js');
	var newExpense     = require('./newExpense.page.js');

  it("should have a projects list with 5 projects", function() {
    browser.get('http://localhost:3030/www/#/tab/projects?local=true').then(function() {
      return browser.getTitle();
    }).then(function(title) {
      expect(title).toEqual("Ionic Time & Expenses Demo App");
      browser.sleep(3 * sleepMultiplyer);
      expect(browser.getTitle()).toEqual("Projects");
      expect(projects.projectsList.first().getText()).toContain('Clear up roof gutters');
      expect(projects.projectsList.get(6).getText()).toEqual('');
    });

  });


  it("should have a searchable projects list", function() {
    expect(projects.projectsList.first().getText()).toContain('Clear up roof gutters');
    projects.search('collec');
    expect(projects.projectsList.first().getText()).toContain('Collect Bus');
    projects.clearSearch();
    expect(projects.projectsList.first().getText()).toContain('Clear up roof gutters');
  });


  it("should have detailed project view", function() {
    projects.projectsList.get(1).click();
    browser.sleep(0.8 * sleepMultiplyer);
    expect(browser.getTitle()).toContain('Collect Bus');
    expect(projectDetails.description).toContain('Justin would');
    expect(projectDetails.location).toContain('Client');
  });


  it("should have time entries list with 2 items", function() {
  	projectDetails.viewTimeRecs.click();
    browser.sleep(800);
    expect(browser.getTitle()).toEqual('Timesheets');
    expect(viewExpenses.expensesList.count()).toEqual(2);
    browser.navigate().back();
    browser.sleep(800);
  });


  it("should have expense entries list with 1 item", function() {
  	projectDetails.viewExpRecs.click();
    browser.sleep(800);
    expect(browser.getTitle()).toEqual('Expenses');
    expect(viewExpenses.expensesList.count()).toEqual(1);
    browser.navigate().back();
  });


  it("should have a new expense screen", function() {
    browser.sleep(1000);
    projectDetails.newTimeBtn.click();
    browser.sleep(800);
    expect(newExpense.submitBtn.getAttribute('disabled')).toBe('true');
  });


  it("should be able to cancel new expense", function() {
    newExpense.cancelBtn.click();
    browser.sleep(1000);
    expect(browser.getTitle()).toContain('Collect Bus');
    projectDetails.newTimeBtn.click();
  });

  it("should have enabled submit when valid input", function() {
    expect(newExpense.submitBtn.getAttribute('disabled')).toBe('true');
    newExpense.description.sendKeys('test expense');
    expect(newExpense.submitBtn.getAttribute('disabled')).toBe('true');
    newExpense.expenseValue.sendKeys('123');
    expect(newExpense.submitBtn.getAttribute('disabled')).toBe(null);
  });


  it("should be able to submit a new expense and view it", function() {
  	newExpense.submitBtn.click();
    browser.sleep(800);
  	projectDetails.viewTimeRecs.click();
    browser.sleep(800);
    expect(browser.getTitle()).toEqual('Timesheets');
    expect(viewExpenses.expensesList.count()).toEqual(3);
    browser.sleep(2000);
    browser.navigate().back();
  });

});