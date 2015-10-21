
describe("Projects", function() {

  it("should have a projects list with 5 projects", function() {
    browser.get('http://localhost:3030/www/#/tab/projects?local=true').then(function() {
      return browser.getTitle();
    }).then(function(title) {
      expect(title).toEqual("Ionic Time & Expenses Demo App");
      browser.sleep(3000);
      expect(browser.getTitle()).toEqual("Projects");
      var projects = element.all(by.collRepeater('project in projects'));
      expect(projects.first().getText()).toContain('Clear up roof gutters');
      expect(projects.get(6).getText()).toEqual('');
    });

  });

  it("should have a searchable projects list", function() {
    var projects = element.all(by.binding('project.Name'));
    var searchBox = element(by.model('search.query'));
    expect(projects.first().getText()).toContain('Clear up roof gutters');
    searchBox.sendKeys('collec');
    expect(projects.first().getText()).toContain('Collect Bus');
    searchBox.clear();
    expect(projects.first().getText()).toContain('Clear up roof gutters');
  });

  it("should have detailed project view", function() {
    var projects = element.all(by.binding('project.Name'));
    projects.get(1).click();
    browser.sleep(800);
    expect(browser.getTitle()).toContain('Collect Bus');
    expect(element(by.model('project.formDescription')).getAttribute('value')).toContain('Justin would');
    expect(element(by.binding('project.location')).getText()).toContain('Client');
  });


  it("should have time entries list with 2 items", function() {
    element.all(by.css('.item-icon-left')).get(1).click();
    browser.sleep(800);
    expect(browser.getTitle()).toEqual('Timesheets');
    var timesheets = element.all(by.repeater('record in expenses'));
    expect(timesheets.count()).toEqual(2);
    expect(timesheets.first().element(by.binding('record.mobilecaddy1__Short_Description__c')).getText()).toEqual('Hooking up cats');
    expect(timesheets.first().element(by.tagName('p')).getText()).toContain('30 minutes');
    expect(timesheets.first().element(by.tagName('p')).getText()).toContain('TAE-005686');
    browser.navigate().back();
  });


  it("should have expense entries list with 1 item", function() {
    browser.sleep(500);
    element.all(by.css('.item-icon-left')).get(2).click();
    browser.sleep(800);
    expect(browser.getTitle()).toEqual('Expenses');
    var timesheets = element.all(by.repeater('record in expenses'));
    expect(timesheets.count()).toEqual(1);
    expect(timesheets.first().element(by.binding('record.mobilecaddy1__Short_Description__c')).getText()).toEqual('Coffee and toast');
    expect(timesheets.first().element(by.tagName('p')).getText()).toContain('£8');
    expect(timesheets.first().element(by.tagName('p')).getText()).toContain('TAE-005686');
    browser.navigate().back();
  });


  it("should have a new expense screen", function() {
    browser.sleep(1000);
    element.all(by.css('.button-block')).get(1).click();
    browser.sleep(800);
    var subBtn = element(by.css('.submit-expense'));
    expect(subBtn.isEnabled()).toEqual(false);
  });


  it("should be able to cancel new expense", function() {
    element(by.css('.button-assertive')).click();
    browser.sleep(1000);
    expect(browser.getTitle()).toContain('Collect Bus');
  });

  it("should have enabled submit when valid input", function() {
    browser.sleep(500);
    element.all(by.css('.button-block')).get(1).click();
    browser.sleep(500);
    var subBtn =  element(by.css('.submit-expense'));
    expect(subBtn.getAttribute('disabled')).toBe('true')
    element(by.model('description')).sendKeys('test expense');
    expect(subBtn.getAttribute('disabled')).toBe('true')
    element(by.model('expenseValue')).sendKeys('123');
    expect(subBtn.getAttribute('disabled')).toBe(null);
    subBtn.click();
  });

  it("should have time entries list with 3 items", function() {
    browser.sleep(800);
    element.all(by.css('.item-icon-left')).get(1).click();
    browser.sleep(800);
    expect(browser.getTitle()).toEqual('Timesheets');
    var timesheets = element.all(by.repeater('record in expenses'));
    expect(timesheets.count()).toEqual(3);
    expect(timesheets.last().element(by.binding('record.mobilecaddy1__Short_Description__c')).getText()).toEqual('test expense');
    expect(timesheets.last().element(by.tagName('p')).getText()).toContain('123');
    browser.navigate().back();
  });
});
