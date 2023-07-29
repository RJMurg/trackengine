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

app.post('/network', (req, res) => {
    // Return the following:
    // 1. Amount of stations
    // 2. Amount of trains
    // 3. Average delay of all trains

    var stations = api.getStations();
    var trains = api.getTrains();

    var stationCount = stations.length;
    var trainCount = trains.length;

    var totalDelay = 0;
    for(var i = 0; i < trains.length; i++){
        totalDelay += trains[i].delay;
    }

    var averageDelay = totalDelay / trains.length;

    res.status(200).json({ stations: stationCount, trains: trainCount, averageDelay: averageDelay, status: 200 });

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