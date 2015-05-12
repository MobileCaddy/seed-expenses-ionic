exports.config = {
          capabilities: {
                  // You can use other browsers
                  // like firefox, phantoms, safari, IE (-_-)
                  'browserName': 'chrome'
          },
          specs: [
                   // We are going to make this file in a minute
                'e2e/test.spec.js'
          ],
          jasmineNodeOpts: {
                  showColors: true,
                 defaultTimeoutInterval: 30000,
                isVerbose: true,
          },
        allScriptsTimeout: 20000,
          onPrepare: function(){
                // implicit and page load timeouts
				  browser.manage().timeouts().pageLoadTimeout(40000);
				  browser.manage().timeouts().implicitlyWait(25000);

				  // for non-angular page
				  browser.ignoreSynchronization = true;
        }
};