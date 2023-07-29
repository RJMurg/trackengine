const express = require('express');
const api = require('./apicall');
const parser = require('./parser');

// Express boilerplate
const app = express();
app.use(express.json());
PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// If someone goes to the root of the site, send them to index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + 'index.html');
});

// API endpoints
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

app.post('/stations/:stationCode', async (req, res) => {
    const station = await api.getStationData(req.params.stationCode);

    if(station.stationName == null){
        res.status(404).json({ message: 'Station not found', status: 404 });
    }
    else{
        res.status(200).json({ station: station, status: 200 });
    }
});

app.post('/trains', async (req, res) => {
    const trains = await api.getTrains();
    res.status(200).json({ trains: trains, status: 200 });
});

app.post('/trains/:stationCode', async (req, res) => {
    // Not implemented
    res.status(501).json({ message: 'Not implemented', status: 501 });
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});