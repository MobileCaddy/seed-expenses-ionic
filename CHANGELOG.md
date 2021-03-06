### 1.1.2 (2016-06-15)


#### Bug Fixes

* Corrected issue with startpage-template.apex referring to references. This caused the first "deploy to platform" to fail.

#### Features

* NONE

#### Breaking Changes

* NONE


### 1.1.1 (2016-06-06)


#### Bug Fixes

* Fixed broken Deploy controller
* Corrected local resource ref for cordova lib used when deployed to the platform

#### Features

* Added commented line for `$compileProvider.debugInfoEnabled(false);` for production release
* Updated `grunt prod` to meet current project setup and add comment banner to uglified output
* Updated `grunt devsetup` command to include font/image name tweaking to get over Summer 16 issue where it appends a query string to filename in Visualforce pages - this broke iOS icons.

#### Breaking Changes

* NONE


### 1.1.0 (2015-11-24)


#### Bug Fixes

* none

#### Features

* Angular Style Guide implementation

#### Breaking Changes

* none


### 1.0.2 (2015-11-17)


#### Bug Fixes

* Fixed broken karma test setup

#### Features

* Using Angular Style Guide for code structure etc.
* Added e2e tests as an example

#### Breaking Changes

* none


### 1.0.1 (2015-10-30)


#### Bug Fixes

* NONE

#### Features

* node v5.0.0 support (flat node_modules structure)

#### Breaking Changes

* none


### 1.0.0  (2015-10-16)


#### Bug Fixes

* NONE

#### Features

* New **Codeflow Control Panel**
* No longer using bower, now using node
* Dep bounce
* ios9 Patch

#### Breaking Changes

* Use on packages only containing 'mobilecaddy1' namespace


### 0.0.1-alpha.6 (2015-07-15)


#### Bug Fixes

* Added missing 'logout' call.

#### Features

* Testing Resources View added to settings area.
* Support for upgrade information on startup and example code for "resume" cordova event
* Handling of cordova "online", "offline" and "resume" events, causing upgrades and syncing.
* CORS server removed (now in mobilecaddy-codeflow dep)
* MobileCaddy libs now injected in controllers and service
* Move mock data to _mock_ dir from _test_ dir
* Added karma/jasmine and unit tests.
* Dep bump

#### Breaking Changes

* none

