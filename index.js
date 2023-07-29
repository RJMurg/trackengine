const express = require('express');
const api = require('./apicall');
const parser = require('./parser');

// Express boilerplate
const app = express();
app.use(express.json());
PORT = process.env.PORT || 3000;

app.post('/status', (req, res) => {
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

app.post('/network', async (req, res) => {
    // Return the following:
    // 1. Amount of stations
    // 2. Amount of trains
    // 3. Amount of running trains
    // 3. Average delay of all trains

    var stations = await api.getStations();
    var trains = await api.getTrains();

    var stationCount = stations.length;
    var allTrainCount = trains.length;

    var runningTrainCount = 0;

    for(var i = 0; i < trains.length; i++){
        if(trains[i].currentStatus == 'Running'){
            runningTrainCount++;
        }
    }

    var totalDelay = 0;
    for(var i = 0; i < trains.length; i++){
        if(trains[i].delay != null){
            totalDelay += parseInt(trains[i].delay), 0;
        }
    }

    var averageDelay = Math.round(totalDelay / trains.length);

    res.status(200).json({ stations: stationCount, trains: allTrainCount, running: runningTrainCount, averageDelay: averageDelay, status: 200 });

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