const { google } = require('googleapis');
 const express = require('express');
 const axios = require('axios');
 const jwt = require('jsonwebtoken');

const app = express();
const port = 3000; // You can change the port number if desired
const accessToken = 'ya29.a0AWY7CknAwKHS9s_PLFg7Azuhw1iQYrE07EX4xK-gNXlWCMEk274u7zHKVReDJ5RtGekjD6LZ4kkbqk_bQ7LqZno9zDHuYh5Mne6Hw-KkSJa55-1ospmWBxyOdtRN_tS8uzuIQ9yFA9oo0s0Rcckxlv4SaiMVaCgYKAcsSARASFQG1tDrpfNbjPPnHGSiAHiRNuxDdBQ0163';
const refreshToken = '1//0fvnGiHt9g5rpCgYIARAAGA8SNwF-L9IrLqzbpY-LnIp46cVniFQxtBU3BX3hU7vPao0y06XyFnYjXapQq9KO83pgAc4wzgMOL78'
const projectId = '989bbf7c-d867-4f93-8058-8650999e3714';
const deviceId = 'CCA7C10000203971'
// Parse JSON request bodies
app.use(express.json());

// Set up authentication
const authClient = new google.auth.OAuth2(
  '897629560316-3skl55d8grcge37ucr9talhevei99k2k.apps.googleusercontent.com', //clientID
  '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', //clientSecrent
  'http://localhost:3000/auth/callback' // Replace with your actual redirect URI
);

// Set access token and refresh token
authClient.setCredentials({
  access_token: accessToken,
  refresh_token: refreshToken,
});

// Add routes for authorization
app.get('/auth', (req, res) => {
  const authorizeUrl = authClient.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/sdm.service',
    prompt: 'consent',
  });
  res.redirect(authorizeUrl);
});


app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await authClient.getToken(code);
    // Store the tokens for future use
    authClient.setCredentials(tokens);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    console.log("accccccc")
    console.log(accessToken)
    console.log(refreshToken)
    const decodedToken = jwt.decode(accessToken);

    if (decodedToken && decodedToken.scope) {
      console.log('Access token scope:', decodedToken.scope);
    } else {
      console.log('Access token does not contain scope information');
    }
    res.send('Authorization successful!');

  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).send('Authorization error');
  }
});

 // Control the thermostat temperature
 app.post('/api/set-temperature', async (req, res) => {
  const { mode, temperature } = req.body;

  try {
    const smartDeviceManagement = google.smartdevicemanagement('v1');

    const request = {
      name: `enterprises/${projectId}/devices/AVPHwEtbj6YncuKzPxL8Kdmb-EpYAXuJTRD2cR16_801wC99-1gnKqeydO-GMqTvri0dR2xg2s7jMSZZPcBvUKmhSG5Yvg`,
      requestBody: {
        command: 'thermostatTemperatureSetpoint',
        params: {
          thermostatTemperatureSetpoint: temperature,
          thermostatTemperatureSetpointUnit: 'F',
        },
      },
      auth: authClient, // Access the authClient variable
    };

    // Set the mode if provided
    if (mode) {
      request.requestBody.params.thermostatMode = mode;
    }

    // Construct the API request URL correctly
    const response = await smartDeviceManagement.enterprises.devices.executeCommand(request, {
      apiEndpoint: 'https://smartdevicemanagement.googleapis.com',
    });
    console.log('Temperature set successfully:', response.data);

    res.status(200).json({ message: 'Temperature set successfully' });
  } catch (error) {
    console.error('Error setting thermostat temperature:', error);
    res.status(500).json({ error: 'Failed to set temperature' });
  }
});

// Function to set the thermostat mode with temperature in Fahrenheit
async function setThermostatMode(deviceId, mode, temperatureFahrenheit) {
   // const url = `https://smartdevicemanagement.googleapis.com/v1/enterprises/enterpriseId/devices/${deviceId}:executeCommand`;
  const url = `https://smartdevicemanagement.googleapis.com/v1/projects/${projectId}/devices/${deviceId}:executeComman`;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`
  };

  const requestBody = {
    command: 'thermostatMode',
    params: {
      thermostatMode: mode,
      thermostatTemperatureSetpoint: {
        thermostatTemperatureSetpoint: temperatureFahrenheit,
        scale: 'F'
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestBody)
  });

  if (response.ok) {
    console.log(`Thermostat mode successfully set to ${mode} with temperature ${temperatureFahrenheit}°F`);
  } else {
    console.error('Failed to set thermostat mode:', response.status, response.statusText);
  }
}

// POST route for setting the thermostat mode
app.post('/api/setThermostatMode', async (req, res) => {
  const { deviceId, mode, temperatureFahrenheit } = req.body;

  try {
    await setThermostatMode(deviceId, mode, temperatureFahrenheit);
    res.sendStatus(200);
  } catch (error) {
    console.error('Failed to set thermostat mode:', error);
    res.sendStatus(500);
  }
});


// POST route for setting the thermostat temperature using traits
app.post('/api/setTemperature', async (req, res) => {
  const { deviceId, temperature } = req.body;

  // Replace with the actual API endpoint provided by the smart home platform
 // const apiUrl = 'https://api.example.com/setTemperature';
  const apiUrl = `https://smartdevicemanagement.googleapis.com/v1/enterprises/*/devices/${deviceId}:executeCommand`;
 
  // Replace with the appropriate authentication headers or access token
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`   ,
  };

  // Prepare the request payload
  const payload = {
    commands: [
      {
        devices: [
          {
            id: deviceId,
            type: 'thermostat',
          },
        ],
        execution: [
          {
            command: 'action.devices.commands.ThermostatTemperatureSetpoint',
            params: {
              thermostatTemperatureSetpoint: temperature,
            },
          },
        ],
      },
    ],
  };

  try {
    const response = await axios.post(apiUrl, payload, { headers });

    if (response.status === 200) {
      console.log('Temperature set successfully');
      res.sendStatus(200);
    } else {
      console.error('Failed to set temperature:', response.status, response.statusText);
      res.sendStatus(500);
    }
  } catch (error) {
    console.error('Failed to set temperature:', error.message);
    res.sendStatus(500);
  }
});


function celsiusToFahrenheit(celsius) {
  return (celsius * 9 / 5) + 32;
}

app.put('/api/thermostats/:mode/:temperature', async (req, res) => {
  const { mode, temperature } = req.params;

  const targetTemperatureFahrenheit = parseFloat(temperature);
  
  if (isNaN(targetTemperatureFahrenheit)) {
    res.status(400).json({ error: 'Invalid temperature value' });
    return;
  }

  try {
    const response = await axios.put(`https://smartdevicemanagement.googleapis.com/v1/enterprises/${projectId}/devices/${deviceId}`, {
      traits: {
        'sdm.devices.traits.ThermostatMode': {
          'mode': mode.toLowerCase(),
        },
        'sdm.devices.traits.TemperatureSetpoint': {
          'coolCelsius': null,
          'coolFahrenheit': targetTemperatureFahrenheit,
          'heatCelsius': null,
          'heatFahrenheit': targetTemperatureFahrenheit
        }
      }
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ message: 'Thermostat settings updated successfully' });
  } catch (error) {
    console.error('Error setting thermostat settings:', error);
    res.status(500).json({ error: 'An error occurred while setting thermostat settings' });
  }
});


app.get('/api/devices', async (req, res) => {
  try {
    const smartDeviceManagement = google.smartdevicemanagement('v1');

    const request = {
      parent: `enterprises/${projectId}/devices`,
    };

    // Send the API request to get the device list
    const response = await smartDeviceManagement.enterprises.devices.list(request);
    console.log('Device list retrieved successfully:', response.data);

    res.status(200).json(response.data.devices);
  } catch (error) {
    console.error('Error retrieving device list:', error);
    res.status(500).json({ error: 'Failed to retrieve device list' });
  }
});

app.get('/api/thermostats', async (req, res) => {
  try {
    const response = await axios.get(`https://smartdevicemanagement.googleapis.com/v1/enterprises/${projectId}/devices`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Process the response and retrieve thermostat devices
    const thermostatDevices = response.data.devices.filter(device => device.type === 'sdm.devices.types.THERMOSTAT');
    res.json(thermostatDevices);
  } catch (error) {
    console.error('Error retrieving thermostat devices:', error.response.data.error);
    res.status(500).json({ error: 'An error occurred while retrieving thermostat devices' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});