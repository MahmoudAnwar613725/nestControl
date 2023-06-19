const { google } = require('googleapis');
 const express = require('express');
 const axios = require('axios');
 const jwt = require('jsonwebtoken');

const app = express();
const port = 3000; // You can change the port number if desired

// Parse JSON request bodies
app.use(express.json());

// Set up authentication
const authClient = new google.auth.OAuth2(
  '897629560316-3skl55d8grcge37ucr9talhevei99k2k.apps.googleusercontent.com',
  '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',
  'http://localhost:3000/auth/callback' // Replace with your actual redirect URI
);

// Set access token and refresh token
authClient.setCredentials({
  access_token: 'ya29.a0AWY7CkmEKSx2l-iLmzLFozNP0LcRU_llLgWQ6OKPrE8JdPWj-2NCgC-ish9dBcV6V7w2L882O8mYn9e2IIbAYRJ8TcF58A8rW1pgddpF9QSjOG_mY-eCeclAiusCu4LkcJjRKgkGgt-zEg1bCdCbYRnAvTaqaCgYKAf0SARASFQG1tDrppfItMwRPDJ184gRgWifHMw0163',
  refresh_token: '1//0f6f6ljj80UDECgYIARAAGA8SNwF-L9IrBFqz81aZz25csbFq-dhkQcVN8YlDlMNZNuJQdzvH1jmqLvbGA1-JdSWFBhhAfdh3TDc',
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
      name: 'enterprises/989bbf7c-d867-4f93-8058-8650999e3714/devices/AVPHwEtbj6YncuKzPxL8Kdmb-EpYAXuJTRD2cR16_801wC99-1gnKqeydO-GMqTvri0dR2xg2s7jMSZZPcBvUKmhSG5Yvg',
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
  const accessToken = 'ya29.a0AWY7CkmEKSx2l-iLmzLFozNP0LcRU_llLgWQ6OKPrE8JdPWj-2NCgC-ish9dBcV6V7w2L882O8mYn9e2IIbAYRJ8TcF58A8rW1pgddpF9QSjOG_mY-eCeclAiusCu4LkcJjRKgkGgt-zEg1bCdCbYRnAvTaqaCgYKAf0SARASFQG1tDrppfItMwRPDJ184gRgWifHMw0163'; // Replace with your access token
  const projectId = '989bbf7c-d867-4f93-8058-8650999e3714'
 // const url = `https://smartdevicemanagement.googleapis.com/v1/enterprises/enterpriseId/devices/${deviceId}:executeCommand`;
  const url = `https://smartdevicemanagement.googleapis.com/v1/projects/${projectId}/devices/${deviceId}:executeComman`;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ya29.a0AWY7Ckmv5ew_HHrFVqhsk5tXjGKA96n5hMqJ2DeKBKoNt2G0BXAYR-QycYw3q5MoyyU65vAyuF74yKh8lrvtex3O5dX-TKqhxruVSmbpedBCDehUvzRZ2IldjhiZQa4NWqBH5jfF2tcIzKfMLkMURB5MVNDEaCgYKAWYSARISFQG1tDrpzZ7gTZ9s3SkZQZhCVnJW4Q0163'
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
  const accessToken = 'ya29.a0AWY7CkmEKSx2l-iLmzLFozNP0LcRU_llLgWQ6OKPrE8JdPWj-2NCgC-ish9dBcV6V7w2L882O8mYn9e2IIbAYRJ8TcF58A8rW1pgddpF9QSjOG_mY-eCeclAiusCu4LkcJjRKgkGgt-zEg1bCdCbYRnAvTaqaCgYKAf0SARASFQG1tDrppfItMwRPDJ184gRgWifHMw0163'; // Replace with your access token

  // Replace with the appropriate authentication headers or access token
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ya29.a0AWY7CkmEKSx2l-iLmzLFozNP0LcRU_llLgWQ6OKPrE8JdPWj-2NCgC-ish9dBcV6V7w2L882O8mYn9e2IIbAYRJ8TcF58A8rW1pgddpF9QSjOG_mY-eCeclAiusCu4LkcJjRKgkGgt-zEg1bCdCbYRnAvTaqaCgYKAf0SARASFQG1tDrppfItMwRPDJ184gRgWifHMw0163'   ,
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




app.get('/api/devices', async (req, res) => {
  try {
    const smartDeviceManagement = google.smartdevicemanagement('v1');

    const request = {
      parent: 'enterprises/989bbf7c-d867-4f93-8058-8650999e3714/devices',
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

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});