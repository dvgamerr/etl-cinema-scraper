module.exports = {
  src_folders: ['tests/specs'],
  // page_objects_path: ['tests/objects'],
  // custom_commands_path: ['tests/custom-commands'],
  // custom_assertions_path: ['tests/custom-assertions'],
  globals_path: '',
  webdriver: {},
  test_settings: {
    default: {
      globals: {
        waitForConditionTimeout: 5000,
        abortOnAssertionFailure : false,
        waitForConditionPollInterval : 3000,
        throwOnMultipleElementsReturned : false,
        asyncHookTimeout : 10000
      },
      disable_error_log: false,
      screenshots: {
        enabled: false,
        path: 'screens',
        on_failure: true
      },

      desiredCapabilities: {
        acceptSslCerts: true,
        javascriptEnabled: true,
        browserName: 'chrome'
      },
      
      webdriver: {
        start_process: true,
        server_path: ''
      },
      
    },
    
    chrome: {
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          w3c: true,
          args: [
            '--no-sandbox',
            '--ignore-certificate-errors',
          ]
        }
      },

      webdriver: {
        start_process: true,
        server_path: '',
        cli_args: [
          // --verbose
        ]
      }
    },
    
    //////////////////////////////////////////////////////////////////////////////////
    // Configuration for when using the Selenium service, either locally or remote,  |
    //  like Selenium Grid                                                           |
    //////////////////////////////////////////////////////////////////////////////////
    selenium_server: {
      // Selenium Server is running locally and is managed by Nightwatch
      // More info on setting up Selenium Server locally:
      // https://nightwatchjs.org/guide/quickstarts/create-and-run-a-test-with-selenium-server.html
      selenium: {
        start_process: true,
        port: 4444,
        server_path: '', // Leave empty if @nightwatch/selenium-server is installed
        command: 'standalone', // Selenium 4 only
        cli_args: {
          // 'webdriver.gecko.driver': '',
          // 'webdriver.chrome.driver': '',
          // 'webdriver.edge.driver': './path/to/msedgedriver'
        }
      },
      webdriver: {
        start_process: false,
        default_path_prefix: '/wd/hub'
      }
    },
    
    'selenium.chrome': {
      extends: 'selenium_server',
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          w3c: true,
          args: [
            '--no-sandbox',
            '--ignore-certificate-errors',
            '--disable-dev-shm-usage'
          ]
        }
      }
    },
  }
};
