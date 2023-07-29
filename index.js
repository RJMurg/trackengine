const express = require('express');
const api = require('./apicall');
const parser = require('./parser');

// Express boilerplate
const app = express();
app.use(express.json());
PORT = process.env.PORT || 3000;

app.get('/status', (req, res) => {
    var start = Date.now();
    api.getStations();
    var end = Date.now();
    var externalDelay = end - start;

    var statusMessage = 'ok';
    var currentTime = new Date();

    if(externalDelay > 200){
        statusMessage = 'slow';
    }

    res.status(200).json({ message: 'ok', status: 200, timestamp: currentTime, delay: externalDelay + 'ms' });
});

app.post('/stations', async (req, res) => {
    const stations = await api.getStations();
    res.status(200).json({ stations: stations, status: 200 });
});

app.post('/trains', async (req, res) => {
    const trains = await api.getTrains();
    res.status(200).json({ trains: trains, status: 200 });
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});