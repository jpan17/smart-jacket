/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function logOutput(message) {
    document.getElementById('output').innerHTML += message + '<br>';
}

function onAccelSuccess(acceleration) {
    var x = acceleration[0]; 
    var y = acceleration[1];
    var z = acceleration[2];

    logOutput('x: ' + x + ', y: ' + y + ', z: ' + z);
    sensors.disableSensor();
}

// Call itself every timeout interval
function accelRoutine() {
    sensors.enableSensor("ACCELEROMETER");
    sensors.getState(onAccelSuccess, function() {document.getElementById('output').innerHTML = 'failed oops';});
    setTimeout(accelRoutine, 1000);
}

function connectSuccess(result) {

    if (result.status === "connected") {

        logOutput("Connected successfully to: " + result.address);
    }
    else if (result.status === "disconnected") {

        logOutput("Disconnected from device: " + result.address);
    }
}

function stopScan() {
    bluetoothle.stopScan(stopScanSuccess, function() {});
}

function startScanSuccess(result) {
    if (result.status === 'scanStarted') {
        logOutput('Scan started');
    }
    if (result.status === 'scanResult') {
        if (result.name === 'Adafruit Bluefruit LE') {
            logOutput('Scan has found a compatible device: ' + result.name + ', ' + result.address);

            stopScan();
            new Promise(function (resolve, reject) {

                bluetoothle.connect(resolve, reject, { address: result.address });
    
            }).then(connectSuccess, function() { logOutput('Failed to connect to bluetooth'); });

        }
    }
}

function stopScanSuccess(result) {
    if (result.status === 'scanStopped') {
        logOutput('Scan stopped');
    } else {
        logOutput('Scan failed to stop');
    }
}

function bluetoothInitializationSuccess(result) {

    if (result.status === 'enabled') {
        logOutput('Bluetooth enabled!');
    } else {
        logOutput('Error enabling Bluetooth');
    }

    // check/request permissions
    bluetoothle.hasPermission(function(result) {
        if (result.hasPermission) {
            logOutput('Has permission: ' + result.hasPermission)            
        } else {
            logOutput('Requesting permission...');
            bluetoothle.requestPermission(function(result) {logOutput('Permission granted: ' + result.requestPermission)}, function() { logOutput('Permission request failed')});
        }
    });
    bluetoothle.isLocationEnabled(function(result) {
        if (result.isLocationEnabled) {
            logOutput('Location enabled: ' + result.isLocationEnabled)            
        } else {
            logOutput('Requesting location...');
            bluetoothle.requestLocation(function(result) {logOutput('Location granted: ' + result.requestLocation)}, function() { logOutput('Location request failed')});
        }
    });

    bluetoothle.startScan(startScanSuccess, function() { logOutput("Scan failed"); }, {
        "services": [],
        "scanMode": bluetoothle.SCAN_MODE_LOW_LATENCY,
        "matchMode": bluetoothle.MATCH_MODE_AGGRESSIVE,
        "matchNum": bluetoothle.MATCH_NUM_MAX_ADVERTISEMENT,
        "callbackType": bluetoothle.CALLBACK_TYPE_ALL_MATCHES,
      });

    setTimeout(stopScan, 10000)

}

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');
    logOutput('on device ready');

    // Accelerometer stuff
    // accelRoutine();

    // Bluetooth stuff
    new Promise(function (resolve) {

        bluetoothle.initialize(resolve, { request: true, statusReceiver: false });
        logOutput('bluetoothle initialize called');

    }).then(bluetoothInitializationSuccess, function() { logOutput("promise failed for bluetooth init"); });

}
