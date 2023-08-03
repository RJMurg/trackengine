const express = require('express');
const api = require('./apicall');
const parser = require('./parser');

// Express boilerplate
const app = express();
app.use(express.json());
PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// API endpoints


// STATION endpoints

// Endpoints which return stations
app.post('/stations', async (req, res) => {
    try{
        const stations = await api.getStations();
        res.status(200).json({ stations: stations, status: 200 });
    }
    catch(err){
        res.status(500).json({ message: 'Internal server error', status: 500 });
    }
});

app.post('/stations/type/:stationType', async (req, res) => {
    try{
        const stations = await api.getStationsType(req.params.stationType);
        res.status(200).json({ stations: stations, status: 200 });
    }
    catch(err){
        res.status(500).json({ message: 'Internal server error', status: 500 });
        console.log(err)
    }
});

// Endpoints which return trains
app.post('/stations/code/:stationCode/:time?', async (req, res) => {
    try{
        const station = await api.getStationCode(req.params.stationCode, req.params.time); // 'undefined' if no time is specified, handled by the api call

        if(station.stationName == null){
            if(await api.stationExistsCode(req.params.stationCode)){
                res.status(404).json({ message: 'No data found', status: 404 });
            }
            else{
                res.status(400).json({ message: 'Station not found', status: 400 });
            }
        }
        else{
            res.status(200).json({ station: station, status: 200 });
        }
    }
    catch(err){
        res.status(500).json({ message: 'Internal server error', status: 500 });
    }
});

app.post('/stations/filter/:text' , async (req, res) => {
    const stations = await api.getStationsFilter(req.params.text);

    if(stations == 'No stations found'){
        res.status(404).json({ message: 'No stations found', status: 404 });
    }
    else{
        res.status(200).json({ stations: stations, status: 200 });
    }
});

app.post('/stations/name/:stationName/:time?', async (req, res) => {

    try{
        const station = await api.getStationName(req.params.stationName, req.params.time); // 'undefined' if no time is specified, handled by the api call
        console.log(station)

        if(station.stationName == null){

            if(await api.stationExistsName(req.params.stationName)){
                res.status(404).json({ message: 'No data found', status: 404 });
            }
            else{
                res.status(400).json({ message: 'Station not found', status: 400 });
            }
        }
        else{
            res.status(200).json({ station: station, status: 200 });
        }
    }
    catch(err){
        res.status(500).json({ message: 'Internal server error', status: 500 });
    }
});

app.post('/stations/info/:stationCode', async (req, res) => {
    // Not implemented
    res.status(501).json({ message: 'Not implemented', status: 501 });

    // When finished, this will return something of the following:
    /*
    Station name
    Station code
    Station type
    [
        Trains so far today
        Trains in the next 90 mins
        Cumulitive delay for today
        [
            Next Train
        ]
    ]
    */
});


// TRAIN endpoints
app.post('/trains', async (req, res) => {
    try{
        const trains = await api.getTrains();
        res.status(200).json({ trains: trains, status: 200 });
    }
    catch(err){
        res.status(500).json({ message: 'Internal server error', status: 500 });
    }
});

app.post('/trains/id/:id', async (req, res) => {
    try{
        const train = await api.getTrainID(req.params.id);

        if(train.trainCode == null){
            res.status(404).json({ message: 'Train not found', status: 404 });
        }
        else if(train == 'Train not found'){
            res.status(404).json({ message: 'Train not found', status: 404 });
        }
        else{
            res.status(200).json({ train: train, status: 200 });
        }
    }
    catch(err){
        res.status(500).json({ message: 'Internal server error', status: 500 });
    }
});

app.post('/trains/type/:type', async (req, res) => {
    const trains = await api.getTrainType(req.params.type);

    if(trains == 'Invalid train type'){
        res.status(400).json({ message: 'Invalid train type', status: 400 });
    }
    else{
        res.status(200).json({ trains: trains, status: 200 });
    }
});

app.post('/trains/route', async (req, res) => {
    const routes = await api.getRoutes();

    res.status(200).json({ routes: routes, status: 200 });
});

app.post('/trains/history/:id/:date/:type?' , async (req, res) => {
    try{
        train = await api.getTrainHistory(req.params.id, req.params.date, req.params.type);

        if(train == 'Train not found'){
            res.status(404).json({ message: 'Train not found', status: 404 });
        }
        else{
            res.status(200).json({ train: train, status: 200 });
        }
    }
    catch(err){
        res.status(500).json({ message: 'Internal server error', status: 500 });
        console.log(err)
    }
});

app.post('/trains/route/:route', async (req, res) => {
    // Not implemented
    res.status(501).json({ message: 'Not implemented', status: 501 });
});

// OTHER endpoints
app.post('/other/status', async (req, res) => {
    try{
        var start = Date.now();
        await api.getTrainHistory('A215', '03-08-2023', 'stops');
        var end = Date.now();
        var externalDelay = end - start;

        var statusMessage = 'ok';
        var currentTime = new Date();

        if(externalDelay > 200){ 
            statusMessage = 'slow';
        }

        res.status(200).json({ message: 'ok', status: 200, timestamp: currentTime, delay: externalDelay + 'ms' });
    }
    catch(err){
        res.status(500).json({ message: 'Internal server error', status: 500 });
    }
});

app.post('/other/network', async (req, res) => {
    try{
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
    }
    catch(err){
        res.status(500).json({ message: 'Internal server error', status: 500 });
    }
});


app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});