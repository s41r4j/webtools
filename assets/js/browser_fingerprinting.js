document.addEventListener('DOMContentLoaded', function() {
  var fingerprintingDetails = [
    {
      category: 'Browser Information',
      items: [
        { label: 'User Agent', id: 'userAgent' },
        { label: 'Browser', id: 'browser' },
        { label: 'Browser Engine', id: 'browserEngine' },
        { label: 'Cookies Enabled', id: 'cookiesEnabled' },
        { label: 'JavaScript Enabled', id: 'javascriptEnabled' },
        { label: 'Browser Window Size', id: 'windowSize' },
        { label: 'Addons', id: 'addons' },
        { label: 'Ad Blocker Used', id: 'adBlockerUsed' },
      ]
    },
    {
      category: 'Device Information',
      items: [
        { label: 'Device', id: 'device' },
        { label: 'Operating System', id: 'operatingSystem' },
        { label: 'Screen Dimensions', id: 'computerScreen' },
        { label: 'Time Zone', id: 'timeZone' },
        { label: 'System Fonts', id: 'systemFonts' },
        { label: 'CPU Cores', id: 'cpuCores' },
        { label: 'Memory', id: 'memory' },
        { label: 'GPU', id: 'gpu' }
      ]
    },
    {
      category: 'Network Information',
      items: [
        { label: 'VPN Detection', id: 'vpnDetection' },
        { label: 'Proxy Detection', id: 'proxyDetection' },
        { label: 'Tor Detection', id: 'torDetection' },
        { label: 'Local IP', id: 'localIP' },
        { label: 'Public IP', id: 'publicIP' },
        { label: 'Location', id: 'location' },
        { label: 'Internet Speed', id: 'internetSpeed' },
      ]
    },
  ];
  
  var containerElement = document.getElementById('fingerprintingContainer');
  
  var tableElement = document.createElement('table');
  tableElement.classList.add('table');
  
  fingerprintingDetails.forEach(function (category) {
    var categoryRow = document.createElement('tr');
    categoryRow.classList.add('category-row');
  
    var categoryCell = document.createElement('td');
    categoryCell.classList.add('category-cell');
    categoryCell.textContent = category.category;
    categoryCell.colSpan = 2;
    categoryRow.appendChild(categoryCell);
  
    tableElement.appendChild(categoryRow);
  
    category.items.forEach(function (detail) {
      var row = document.createElement('tr');
  
      var labelCell = document.createElement('td');
      labelCell.textContent = detail.label;
      row.appendChild(labelCell);
  
      var valueCell = document.createElement('td');
      valueCell.id = detail.id;
      row.appendChild(valueCell);
  
      tableElement.appendChild(row);
    });
  });
  
  var containerWrapper = document.createElement('div');
  containerWrapper.classList.add('table-container');
  containerWrapper.appendChild(tableElement);
  
  containerElement.appendChild(containerWrapper);
  

  // Get the user agent
  var userAgent = navigator.userAgent;
  var userAgentElement = document.getElementById('userAgent');
  userAgentElement.textContent = userAgent;

  // Get the browser details
  var browserElement = document.getElementById('browser');
  var browserDetails = parseBrowser(userAgent);
  if (browserDetails) {
    browserElement.textContent = browserDetails;
  } else {
    browserElement.parentElement.style.display = 'none';
  }

  // Function to parse the browser from user agent
  function parseBrowser(userAgent) {
    var matches = userAgent.match(/(firefox|chrome|safari|opera|edge|msie|trident(?=\/))\/?\s*(\d+)/i);
    if (matches && matches.length >= 3) {
      return matches[1] + ' ' + matches[2];
    } else {
      return null;
    }
  }

  // Function to detect the device
  function getDevice() {
    var isMobile = /Mobile|Android|iP(hone|od|ad)/i.test(navigator.userAgent);
    return isMobile ? 'Mobile Device' : 'Desktop/Laptop';
  }

  // Function to detect the operating system
  function getOperatingSystem() {
    var platform = navigator.platform;
    var userAgent = navigator.userAgent;

    if (/Win/i.test(platform)) {
      return 'Windows';
    } else if (/Mac/i.test(platform)) {
      return 'Mac OS';
    } else if (/Linux/i.test(platform)) {
      return 'Linux';
    } else if (/Android/i.test(userAgent)) {
      return 'Android';
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      return 'iOS';
    } else {
      return 'Unknown';
    }
  }

  // Function to detect VPN
  function detectVPN() {
    // Implement your VPN detection logic here
    return false;
  }

  // Function to detect proxy
  function detectProxy() {
    // Implement your proxy detection logic here
    return false;
  }

  // Function to detect Tor using the Tor Project website
  function detectTor() {
    return new Promise(function(resolve, reject) {
      fetch('https://check.torproject.org/', { mode: 'no-cors' })
        .then(function(response) {
          var headers = response.headers;
          var isTor = headers.has('Onion-Location');
          resolve(isTor);
        })
        .catch(function(error) {
          console.error('Tor detection error:', error);
          reject();
        });
    });
  }

  // Update the table with Tor detection result
  function updateTorDetectionResult(isTor) {
    var torDetectionElement = document.getElementById('torDetection');
    torDetectionElement.textContent = isTor ? 'Detected' : 'Not Detected';
  }

  // Usage example
  detectTor()
    .then(function(isTor) {
      updateTorDetectionResult(isTor);
    })
    .catch(function() {
      updateTorDetectionResult(false);
    });

    



  // Function to check if cookies are enabled
  function areCookiesEnabled() {
    // Check if normal cookies are enabled
    var normalCookiesEnabled = navigator.cookieEnabled;

    // Check if third-party cookies are enabled
    var thirdPartyCookiesEnabled = true;
    document.cookie = 'thirdPartyCookieTest=true';
    if (document.cookie.indexOf('thirdPartyCookieTest') === -1) {
      thirdPartyCookiesEnabled = false;
    }
    document.cookie = 'thirdPartyCookieTest=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    return normalCookiesEnabled && thirdPartyCookiesEnabled;
  }

  // Function to check if JavaScript is enabled
  function isJavaScriptEnabled() {
    try {
      eval("1 + 1"); // Evaluating a simple expression
      return true; // JavaScript is enabled
    } catch (error) {
      return false; // JavaScript is disabled
    }
  }

  // Function to get the local IP address
  function getLocalIP() {
    return new Promise(function(resolve, reject) {
      var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
      if (!RTCPeerConnection) {
        reject();
      }

      var rtcPeerConnection = new RTCPeerConnection({
        iceServers: []
      });
      rtcPeerConnection.createDataChannel('');

      rtcPeerConnection.onicecandidate = function(event) {
        if (event && event.candidate && event.candidate.candidate) {
          var localIP = event.candidate.candidate.split('\n')[0].split(' ')[4];
          resolve(localIP);
        } else {
          reject();
        }

        rtcPeerConnection.close();
      };

      rtcPeerConnection.createOffer(function(offer) {
        rtcPeerConnection.setLocalDescription(offer);
      }, function() {
        reject();
      });
    });
  }

  // Function to get the public IP address
  function getPublicIP() {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://api.ipify.org?format=json', true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          var response = JSON.parse(xhr.responseText);
          resolve(response.ip);
        } else {
          reject();
        }
      };
      xhr.send();
    });
  }

  // Function to get the location
  function getLocation() {
    return new Promise(function(resolve, reject) {
      // Implement your location detection logic here
      resolve('N/A');
    });
  }

  // Function to get the screen size (pixels)
  function getScreenSize() {
    return window.screen.width + ' x ' + window.screen.height;
  }

  // Function to get the browser window size
  function getWindowSize() {
    return window.innerWidth + ' x ' + window.innerHeight;
  }

  // Function to get the system fonts
  function getSystemFonts() {
    var fonts = [];
    if (document.fonts) {
      document.fonts.forEach(function(font) {
        fonts.push(font.family);
      });
    }
    return fonts.length > 0 ? fonts.join(', ') : 'N/A';
  }

  // Function to detect if an ad blocker is used
  function detectAdBlocker() {
    return new Promise(function(resolve, reject) {
      var testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      document.body.appendChild(testAd);

      window.setTimeout(function() {
        if (testAd.offsetHeight === 0) {
          resolve(true); // Ad blocker detected
        } else {
          resolve(false); // No ad blocker detected
        }
        testAd.remove();
      }, 100);
    });
  }

  // Call the functions to get the fingerprinting details
  var deviceElement = document.getElementById('device');
  deviceElement.textContent = getDevice();

  var operatingSystemElement = document.getElementById('operatingSystem');
  operatingSystemElement.textContent = getOperatingSystem();

  var vpnDetectionElement = document.getElementById('vpnDetection');
  vpnDetectionElement.textContent = detectVPN() ? 'Detected' : 'Not Detected';

  var proxyDetectionElement = document.getElementById('proxyDetection');
  proxyDetectionElement.textContent = detectProxy() ? 'Detected' : 'Not Detected';

  var torDetectionElement = document.getElementById('torDetection');
  torDetectionElement.textContent = detectTor() ? 'Detected' : 'Not Detected';

  var cookiesEnabledElement = document.getElementById('cookiesEnabled');
  cookiesEnabledElement.textContent = areCookiesEnabled() ? 'Enabled' : 'Disabled';

  var javascriptEnabledElement = document.getElementById('javascriptEnabled');
  javascriptEnabledElement.textContent = isJavaScriptEnabled() ? 'Enabled' : 'Disabled';

  var localIPElement = document.getElementById('localIP');
  getLocalIP().then(function(localIP) {
    localIPElement.textContent = localIP || 'N/A';
  }).catch(function() {
    localIPElement.textContent = 'N/A';
  });

  var publicIPElement = document.getElementById('publicIP');
  getPublicIP().then(function(publicIP) {
    publicIPElement.textContent = publicIP || 'N/A';
  }).catch(function() {
    publicIPElement.textContent = 'N/A';
  });

  var locationElement = document.getElementById('location');
  getLocation().then(function(location) {
    locationElement.textContent = location || 'N/A';
  }).catch(function() {
    locationElement.textContent = 'N/A';
  });

  var computerScreenElement = document.getElementById('computerScreen');
  computerScreenElement.textContent = getScreenSize() + ' pixels';

  var windowSizeElement = document.getElementById('windowSize');
  windowSizeElement.textContent = getWindowSize() + ' pixels';

  var internetSpeedElement = document.getElementById('internetSpeed');
  internetSpeedElement.textContent = 'N/A'; // Replace with the implementation to detect internet speed

  var addonsElement = document.getElementById('addons');
  getAddons().then(function(addons) {
    addonsElement.textContent = addons.length > 0 ? addons.join(', ') : 'N/A';
  }).catch(function() {
    addonsElement.textContent = 'N/A';
  });

  var adBlockerUsedElement = document.getElementById('adBlockerUsed');
  detectAdBlocker().then(function(adBlockerUsed) {
    adBlockerUsedElement.textContent = adBlockerUsed ? 'Used' : 'Not Used';
  }).catch(function() {
    adBlockerUsedElement.textContent = 'N/A';
  });

  var timeZoneElement = document.getElementById('timeZone');
  timeZoneElement.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;

  var systemFontsElement = document.getElementById('systemFonts');
  systemFontsElement.textContent = getSystemFonts();

  // Get the hardware-related information
  function getHardwareInfo() {
    var hardwareInfo = {
      cpuCores: navigator.hardwareConcurrency || 'N/A',
      memory: navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'N/A',
      gpu: 'N/A' // Implement GPU detection logic here
    };
    return hardwareInfo;
  }

  // Update the hardware-related information in the table
  var hardwareInfo = getHardwareInfo();
  var cpuCoresElement = document.getElementById('cpuCores');
  cpuCoresElement.textContent = hardwareInfo.cpuCores;
  var memoryElement = document.getElementById('memory');
  memoryElement.textContent = hardwareInfo.memory;
  var gpuElement = document.getElementById('gpu');
  gpuElement.textContent = hardwareInfo.gpu;

  // Function to get the addons
  function getAddons() {
    return new Promise(function(resolve, reject) {
      if (navigator && navigator.plugins && navigator.plugins.length > 0) {
        var addons = Array.from(navigator.plugins).map(function(plugin) {
          return plugin.name;
        });
        resolve(addons);
      } else {
        resolve([]);
      }
    });
  }

  // Add print button functionality
  var printButton = document.getElementById('printButton');
  printButton.addEventListener('click', function() {
    // Add a class to the body to apply the print styles
    document.body.classList.add('print-mode');

     // Wait for a short delay to allow the styles to be applied
    setTimeout(function() {
        // Use the browser's print functionality to save the rendered content as a PDF
        window.print();

        // Remove the print class after printing
        document.body.classList.remove('print-mode');
      }, 100); 
    });

});
