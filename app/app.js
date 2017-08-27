//
// Copyright 2014, Andreas Lundquist
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// DFRobot - Bluno - Hello World
// version: 0.1 - 2014-11-21
//

// Route all console logs to Evothings studio log
if (window.hyper && window.hyper.log) { console.log = hyper.log; };

document.addEventListener(
	'deviceready',
	function() { evothings.scriptsLoaded(app.initialize) },
	false);

var app = {};

// UUIDs
app.DFRBLU_SERVICE_UUID = '0000dfb0-0000-1000-8000-00805f9b34fb';
app.DFRBLU_CHAR_RXTX_UUID = '0000dfb1-0000-1000-8000-00805f9b34fb';
// Data Array
app.dataPoints = [5,6,7,8,5,6,7,8,9];
app.dataBuffer = [];

app.initialize = function()
{
	app.connected = false;

	// Called when HTML page has been loaded.
	$(document).ready( function()
	{
		// Adjust canvas size when browser resizes
		$(window).resize(app.respondCanvas);

		// Adjust the canvas size when the document has loaded.
		app.respondCanvas();
	});
	var canvas = document.getElementById('canvasHR');
	app.canvas = canvas;
	var context = canvas.getContext('2d');
	app.context = context;
	app.context.strokeStyle = '#f00';
	app.context.save();
	var xpos = 0;
	app.xpos = xpos;
};

/**
 * Adjust the canvas dimensions based on its container's dimensions.
 */
app.respondCanvas = function()
{
	var canvas = $('#canvas')
	var container = $(canvas).parent()
	canvas.attr('width', 350 ) // Max width
	 canvas.attr('height', 300 ) // Max height
};

app.startScan = function()
{
	app.disconnect();

	console.log('Scanning started...');

	app.devices = {};

	var htmlString =
		'<img src="img/loader_small.gif" ' +
			'style="display:inline; vertical-align:middle">' +
		'<p style="display:inline">   Scanning...</p>';

	$('#scanResultView').append($(htmlString));

	$('#scanResultView').show();

	function onScanSuccess(device)
	{
		if (device.name != null)
		{
			app.devices[device.address] = device;

			console.log(
				'Found: ' + device.name + ', ' +
				device.address + ', ' + device.rssi);

			var htmlString =
				'<div class="deviceContainer" onclick="app.connectTo(\'' +
					device.address + '\')">' +
				'<p class="deviceName">' + device.name + '</p>' +
				'<p class="deviceAddress">' + device.address + '</p>' +
				'</div>';

			$('#scanResultView').append($(htmlString));
		}
	}

	function onScanFailure(errorCode)
	{
		// Show an error message to the user
		app.disconnect('Failed to scan for devices.');

		// Write debug information to console.
		console.log('Error ' + errorCode);
	}

	evothings.easyble.reportDeviceOnce(true);
	evothings.easyble.startScan(onScanSuccess, onScanFailure);

	$('#startView').hide();
};

app.setLoadingLabel = function(message)
{
	console.log(message);
	$('#loadingStatus').text(message);
}

app.connectTo = function(address)
{
	device = app.devices[address];

	$('#loadingView').css('display', 'table');

	app.setLoadingLabel('Trying to connect to ' + device.name);

	function onConnectSuccess(device)
	{
		function onServiceSuccess(device)
		{
			// Application is now connected
			app.connected = true;
			app.device = device;

			console.log('Connected to ' + device.name);

			$('#loadingView').hide();
			$('#scanResultView').hide();
			$('#controlView').show();
  

		    device.enableNotification(
			  app.DFRBLU_SERVICE_UUID,
				app.DFRBLU_CHAR_RXTX_UUID,
				app.receivedData,
				function(errorCode) {
					console.log('BLE enableNotification error: ' + errorCode);
				},
				{ writeConfigDescriptor: false });
		}

		function onServiceFailure(errorCode)
		{
			// Disconnect and show an error message to the user.
			app.disconnect('Device is not from DFRobot');

			// Write debug information to console.
			console.log('Error reading services: ' + errorCode);
		}

		app.setLoadingLabel('Identifying services...');

		// Connect to the appropriate BLE service
		device.readServices([app.DFRBLU_SERVICE_UUID], onServiceSuccess, onServiceFailure);
	}

	function onConnectFailure(errorCode)
	{
		// Disconnect and show an error message to the user.
		app.disconnect('Failed to connect to device');

		// Write debug information to console
		console.log('Error ' + errorCode);
	}

	// Stop scanning
	evothings.easyble.stopScan();

	// Connect to our device
	console.log('Identifying service for communication');
	device.connect(onConnectSuccess, onConnectFailure);
};



app.sendData = function(data)
{
	if (app.connected)
	{
		function onMessageSendSucces()
		{
			console.log('Succeded to send message.');
		}

		function onMessageSendFailure(errorCode)
		{
			console.log('Failed to send data with error: ' + errorCode);
			app.disconnect('Failed to send data');
		}

		data = new Uint16Array(data);

		app.device.writeCharacteristic(
			app.DFRBLU_CHAR_RXTX_UUID,
			data,
			onMessageSendSucces,
			onMessageSendFailure);
	}
	else
	{
		// Disconnect and show an error message to the user.
		app.disconnect('Disconnected');

		// Write debug information to console
		console.log('Error - No device connected.');
	}
};

function ArrayBufferToString(buffer) {
	//return BinToText(String.fromCharCode.apply(null, Array.prototype.slice.apply(new Int8Array(buffer))))
    return BinaryToString(String.fromCharCode.apply(null, Array.prototype.slice.apply(new Int8Array(buffer))));
}


function BinToText(binary) {
    var value = parseInt(binary,2).toString(10);
	return value;
}

function BinaryToString(binary) {
    var error;

    try {
        return decodeURIComponent(escape(binary));
    } catch (_error) {
        error = _error;
		console.log(error);
        if (error instanceof URIError) {
            return binary;
        } else {
            throw error;
        }
    }
}

byteArrayToLong = function(/*byte[]*/byteArray) {
    var value = 0;
    for ( var i = byteArray.length - 1; i >= 0; i--) {
        value = (value * 256) + byteArray[i];
    }
    return value;
};

var byteArray = [];
var index = 0;
//$('#analogDigitalResult').append(index + ": " + int_8 + ",");
app.receivedData = function(TXBuf)
{
	index++;
	if (app.connected)
	{	

		byteArray.push(TXBuf)
		if (byteArray.length == 2)
		{
		// 	// Do something with each byte in the array
				//var value = byteArray[0]*256 & byteArray[1];
				console.log("TXBuf Number " + ": " + TXBuf + "\n")
				var first = new DataView(byteArray[0]).getUint8(0)
				// var second = new DataView().getUint8(0, true)
				console.log("1st Number " + ": " + first + "\n")
				// console.log("2nd Number " + ": " + second + "\n")
				byteArray = [];
		}

	}
	else
	{
		// Disconnect and show an error message to the user.
		app.disconnect('Disconnected');

		// Write debug information to console
		console.log('Error - No device connected.');
	}
};


app.intToUint = function(int, nbit) {
    var u = new Uint32Array(1);
    nbit = +nbit || 32;
    if (nbit > 32) throw new RangeError('intToUint only supports ints up to 32 bits');
    u[0] = int;
    if (nbit < 32) { // don't accidentally sign again
        int = Math.pow(2, nbit) - 1;
        return u[0] & int;
    } else {
        return u[0];
    }
}

var index = 1;
/**
 * Plot diagram of sensor values.
 * Values plotted are expected to be between -1 and 1
 * and in the form of objects with fields x, y, z.
 */
app.drawDiagram = function(Signal)
{
	// // Add recent values.
	app.dataPoints.push(Signal);
	app.clearFullCanvas()


	// Value is an accelerometer reading between -1 and 1.
	function calcDiagramY(value)
	{
		// Return Y coordinate for this value.
		var diagramY = ((value * canvas.height) / 2) + (canvas.height / 2);
		return diagramY;
	}

	function drawLine(axis)
	{
		
		app.context.beginPath();
		if (app.dataPoints.length > 1) {
			app.context.moveTo(index-1, app.dataPoints[index-1]); //previous point
			app.context.lineTo(index, app.dataPoints[index]); // plot future point
			app.context.stroke();
			$('#analogDigitalResult').html(index.toString() + ", " + app.dataPoints[index].toString());
		}
		
	}

	//Draw lines.
	drawLine('x');
	index++;
};

app.clearFullCanvas = function()
{
		// Remove data points that do not fit the canvas.
	if (app.dataPoints.length > app.canvas.width)
	{
		//app.dataPoints.splice(0, (app.dataPoints.length - canvas.width));
		app.dataPoints = []
		// // Clear background.
		app.context.clearRect(0, 0, app.canvas.width, app.canvas.height);
		// Clear xpos
		index=1;
	}
};

app.disconnect = function(errorMessage)
{
	if (errorMessage)
	{
		navigator.notification.alert(errorMessage, function() {});
	}

	app.connected = false;
	app.device = null;

	// Stop any ongoing scan and close devices.
	evothings.easyble.stopScan();
	evothings.easyble.closeConnectedDevices();

	console.log('Disconnected');

	$('#scanResultView').hide();
	$('#scanResultView').empty();
	$('#controlView').hide();
	$('#startView').show();
	// Clear data
	app.dataPoints = []
	// Clear canvas
	app.context.clearRect(0, 0, app.canvas.width, app.canvas.height);
};
