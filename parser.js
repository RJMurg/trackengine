const convert = require('xml-js');

module.exports = {
    parseXML: function(xml) {
        const options = { compact: true, ignoreComment: true, spaces: 4, ignoreAttributes: true, ignoreDeclaration: true };
        return convert.xml2js(xml, options);
    },

    parseStations: function(stations) {
        // Stations will have a few duplicates, so they must be filtered
        let uniqueStations = [];

        stations.forEach(station => {
            let found = uniqueStations.find(element => element.StationDesc._text == station.StationDesc._text);

            if (!found) {
                uniqueStations.push(station);
            }
        });
        
        // Remove any spaces from the code
        uniqueStations.forEach(station => {
            station.StationCode._text = station.StationCode._text.replace(/\s/g, '');
        });


        let stationList = [];
        uniqueStations.forEach(station => {
            stationList.push({
                name: station.StationDesc._text,
                code: station.StationCode._text,
                id: station.StationId._text,
                latitude: station.StationLatitude._text,
                longitude: station.StationLongitude._text
            });
        });

        return stationList;
    },

    parseStationsFilter: function(stations) {

        for (let station in stations) {
            stations[station].StationDesc._text = stations[station].StationDesc._text.replace(/&nbsp;/g, ' ');
            stations[station].StationCode._text = stations[station].StationCode._text.replace(/\s/g, '');
        }

        let stationList = [];

        stations.forEach(station => {
            stationList.push({
                stationName: station.StationDesc._text,
                stationCode: station.StationCode._text
            });
        });

        return stationList;
    },

    parseTrains: function(trains) {

        let trainList = [];
        for (let train in trains) {

            let latitude = parseFloat(trains[train].TrainLatitude._text);
            let longitude = parseFloat(trains[train].TrainLongitude._text);
            let rawPublicMessage = trains[train].PublicMessage._text;
            let direction = trains[train].Direction._text;
            let trainCode = trains[train].TrainCode._text;

            let origin = '';
            let destination = '';
            let delay = 0;
            let currentStatus = '';
            let departureTime = '';
            let currentMessage = '';
            let terminatedTime = '';
            
            switch(trains[train].TrainStatus._text){
                case 'N':
                    // Not running
                    currentStatus = 'Not running';
                    break;
                case 'R':
                    // Running
                    currentStatus = 'Running';
                    break;
                case 'T':
                    // Terminated
                    currentStatus = 'Terminated';
                    break;
                default:
                    // Unknown
                    currentStatus = trains[train].TrainStatus._text;
                    break;

            };

            // If the train is running, it will have a delay
            if(currentStatus == 'Running'){
                // The delay is in the public message
                // The delay is in the format "P709\n11:05 - Dundalk to Dublin Connolly (0 mins late)\nDeparted Dundalk next stop Drogheda"

                let publicMessage = rawPublicMessage.split('\\n');

                departureTime = publicMessage[1].split(' - ')[0];

                let originAndDestination = publicMessage[1].split(' - ')[1].split(' to ');

                origin = originAndDestination[0];

                let destinationAndDelay = originAndDestination[1].split('(');

                destination = destinationAndDelay[0];

                let delayString = destinationAndDelay[1].split(' mins late)');
                delay = parseInt(delayString[0]);

                currentMessage = publicMessage[2];
            }
            else if(currentStatus == 'Not running'){
                // The train is not running, so it will have an origin and destination and expected departure time
                // The public message is in the format "A213\nCork to Dublin Heuston\nExpected Departure 11:25"

                let publicMessage = rawPublicMessage.split('\\n');

                let originAndDestination = publicMessage[1].split(' to ');

                origin = originAndDestination[0];
                destination = originAndDestination[originAndDestination.length - 1];

                let expectedDeparture = publicMessage[2].split(' ');
                departureTime = expectedDeparture[expectedDeparture.length - 1];
            }
            else if(currentStatus == 'Terminated'){
                // The train is terminated, it will have departure time, origin, destination, delay and when it was terminated
                // The public message is in the format "E260\n10:33 - Dublin Connolly to Bray(8 mins late)\nTERMINATED Bray at 11:25"

                let publicMessage = rawPublicMessage.split('\\n');

                let departureTimeString = publicMessage[1].split(' - ');

                departureTime = departureTimeString[0];

                let originAndDestination = departureTimeString[1].split(' to ');

                origin = originAndDestination[0];

                let destinationAndDelay = originAndDestination[1].split('(');

                destination = destinationAndDelay[0];

                let delayString = destinationAndDelay[1].split(' mins late)');
                delay = parseInt(delayString[0]);

                let terminatedString = publicMessage[2].split(' ');
                terminatedTime = terminatedString[terminatedString.length - 1];
            }

            // Conditional pushes depending on status
            if(currentStatus == 'Running'){
                trainList.push({
                    trainCode: trainCode,
                    direction: direction,
                    currentStatus: currentStatus,
                    origin: origin,
                    destination: destination,
                    originTime: departureTime,
                    late: delay.toString(),
                    currentMessage: currentMessage,
                    latitude: latitude.toString(),
                    longitude: longitude.toString(),
                    publicMessage: rawPublicMessage
                });
            }
            else if(currentStatus == 'Not running'){
                trainList.push({
                    trainCode: trainCode,
                    direction: direction,
                    currentStatus: currentStatus,
                    origin: origin,
                    destination: destination,
                    originTime: departureTime,
                    latitude: latitude.toString(),
                    longitude: longitude.toString(),
                    publicMessage: rawPublicMessage
                });
            }
            else if(currentStatus == 'Terminated'){
                trainList.push({
                    trainCode: trainCode,
                    direction: direction,
                    currentStatus: currentStatus,
                    origin: origin,
                    destination: destination,
                    originTime: departureTime,
                    destinationTime: terminatedTime,
                    late: delay.toString(),
                    latitude: latitude.toString(),
                    longitude: longitude.toString(),
                    publicMessage: rawPublicMessage
                });
            }
            else{ // In case an abnormal status is returned
                trainList.push({
                    trainCode: trainCode,
                    direction: direction,
                    currentStatus: currentStatus,
                    origin: origin,
                    destination: destination,
                    originTime: departureTime,
                    destinationTime: terminatedTime,
                    late: delay.toString(),
                    currentMessage: currentMessage,
                    latitude: latitudet.toString(),
                    longitude: longitude.toString(),
                    publicMessage: rawPublicMessage
                });
            }

        }

        return trainList;

    },

    parseTrainsByStation: async function(trains) {

        let trainList = [];

        let stationName = "";

        // If there is only one train, it will not be an array
        try{
            if(trains.length == undefined){
                trains = [trains];
            }
        }
        catch(error){
            return {
                stationName: null,
                trains: []
            };
        }

        try {
            stationName = trains[0].Stationfullname._text;
        } catch (error) {
            return {
                stationName: null,
                trains: []
            };
        }

        for (let train in trains){
            let trainCode = trains[train].Traincode._text;
            let origin = trains[train].Origin._text;
            let destination = trains[train].Destination._text;
            let originTime = trains[train].Origintime._text;
            let destinationTime = trains[train].Destinationtime._text;
            let status = trains[train].Status._text;
            let dueIn = trains[train].Duein._text;
            let late = trains[train].Late._text;
            let expectedArrival = trains[train].Exparrival._text;
            let expectedDeparture = trains[train].Expdepart._text;
            let scheduledArrival = trains[train].Scharrival._text;
            let scheduledDeparture = trains[train].Schdepart._text;
            let direction = trains[train].Direction._text;
            let trainType = trains[train].Traintype._text;
            let locationType = '';

            switch(trains[train].Locationtype._text){
                case 'O':
                    locationType = 'Origin';
                    break;
                case 'D':
                    locationType = 'Destination';
                    break;
                case 'S':
                    locationType = 'Stop';
                    break;
                default:
                    locationType = trains[train].Locationtype._text;
                    break;
            }


            let lastLocation = trains[train].Lastlocation._text;

            // Conditional pushes depending on Location Type
            if(locationType == 'Origin'){
                trainList.push({
                    trainCode: trainCode,
                    origin: origin,
                    destination: destination,
                    originTime: originTime,
                    destinationTime: destinationTime,
                    status: status,
                    dueIn: dueIn,
                    late: late,
                    expectedDeparture: expectedDeparture,
                    scheduledDeparture: scheduledDeparture,
                    direction: direction,
                    trainType: trainType,
                    locationType: locationType,
                });
            }
            else if(locationType == 'Destination'){
                trainList.push({
                    trainCode: trainCode,
                    origin: origin,
                    destination: destination,
                    originTime: originTime,
                    destinationTime: destinationTime,
                    status: status,
                    dueIn: dueIn,
                    late: late,
                    expectedArrival: expectedArrival,
                    scheduledArrival: scheduledArrival,
                    direction: direction,
                    trainType: trainType,
                    locationType: locationType,
                    lastLocation: lastLocation
                });
            }
            else if(locationType == 'Stop'){
                trainList.push({
                    trainCode: trainCode,
                    origin: origin,
                    destination: destination,
                    originTime: originTime,
                    destinationTime: destinationTime,
                    status: status,
                    dueIn: dueIn,
                    late: late,
                    expectedArrival: expectedArrival,
                    expectedDeparture: expectedDeparture,
                    scheduledArrival: scheduledArrival,
                    scheduledDeparture: scheduledDeparture,
                    direction: direction,
                    trainType: trainType,
                    locationType: locationType,
                    lastLocation: lastLocation
                });
            }
            else{ // In case an abnormal status is returned
                trainList.push({
                    trainCode: trainCode,
                    origin: origin,
                    destination: destination,
                    originTime: originTime,
                    destinationTime: destinationTime,
                    status: status,
                    dueIn: dueIn,
                    late: late,
                    expectedArrival: expectedArrival,
                    expectedDeparture: expectedDeparture,
                    scheduledArrival: scheduledArrival,
                    scheduledDeparture: scheduledDeparture,
                    direction: direction,
                    trainType: trainType,
                    locationType: locationType,
                    lastLocation: lastLocation
                });
            }
        }

        return {
            stationName: stationName,
            stationCode: trains[0].Stationcode._text,
            trains: trainList
        };
    },

    parseTrainHistory: function(train, include) {

        let trainHistory = [];
        let currentIndex = 0;

        if(train == undefined){
            return 'Train not found';
        }
        
        for (let stop in train) {
            let stopType = train[stop].StopType._text;

            if(stopType == 'C'){
                currentIndex = parseInt(train[stop].LocationOrder._text);
                break;
            }
        }


        for (let stop in train) {
            let locationCode = train[stop].LocationCode._text;
            let locationFullName = train[stop].LocationFullName._text;
            let locationOrder = train[stop].LocationOrder._text;
            let locationType = train[stop].LocationType._text;
            let trainOrigin = train[stop].TrainOrigin._text;
            let trainDestination = train[stop].TrainDestination._text;
            let scheduledArrival = train[stop].ScheduledArrival._text;
            let scheduledDeparture = train[stop].ScheduledDeparture._text;
            let expectedArrival = train[stop].ExpectedArrival._text;
            let expectedDeparture = train[stop].ExpectedDeparture._text;
            let arrival = train[stop].Arrival._text;
            let departure = train[stop].Departure._text;
            let autoArrival = train[stop].AutoArrival._text;
            let autoDepart = train[stop].AutoDepart._text;
            let stopType = train[stop].StopType._text;

            // Parse locationType
            switch (locationType) {
                case 'O':
                    locationType = 'Origin';
                    break;
                case 'D':
                    locationType = 'Destination';
                    break;
                case 'S':
                    locationType = 'Stop';
                    break;
                case 'T':
                    if(include){
                        locationType = 'Timing Point';
                    }
                    else{
                        continue;
                    }
                    break;
                default:
                    locationType = locationType;
                    break;
            }

            // Parse stopType
            switch (stopType) {
                case '-':
                    if(locationOrder == 1){
                        stopType = 'Origin';
                    }
                    else if(locationOrder == train.length){
                        stopType = 'Destination';
                    }
                    else if(locationOrder > currentIndex){
                        stopType = 'Future';
                    }
                    else if(locationOrder < currentIndex){
                        stopType = 'Past';
                    }

                    break;

                case 'C':
                    stopType = 'Current';
                    break;

                case 'N':
                    stopType = 'Next';
                    break;
                default:
                    stopType = stopType;
                    break;
            }

            switch (locationType) {
                case 'Origin':
                    trainHistory.push({
                        locationCode: locationCode,
                        locationFullName: locationFullName,
                        locationOrder: locationOrder,
                        locationType: locationType,
                        origin: trainOrigin,
                        destination: trainDestination,
                        scheduledDeparture: scheduledDeparture,
                        expectedDeparture: expectedDeparture,
                        departure: departure,
                        autoDepart: autoDepart,
                        stopType: stopType
                    });
                    break;

                case 'Destination':
                    trainHistory.push({
                        locationCode: locationCode,
                        locationFullName: locationFullName,
                        locationOrder: locationOrder,
                        locationType: locationType,
                        origin: trainOrigin,
                        destination: trainDestination,
                        scheduledArrival: scheduledArrival,
                        expectedArrival: expectedArrival,
                        arrival: arrival,
                        autoArrival: autoArrival,
                        stopType: stopType
                    });
                    break;

                case 'Stop':

                    if(stopType == 'Past'){
                        trainHistory.push({
                            locationCode: locationCode,
                            locationFullName: locationFullName,
                            locationOrder: locationOrder,
                            locationType: locationType,
                            origin: trainOrigin,
                            destination: trainDestination,
                            scheduledArrival: scheduledArrival,
                            scheduledDeparture: scheduledDeparture,
                            expectedArrival: expectedArrival,
                            expectedDeparture: expectedDeparture,
                            arrival: arrival,
                            departure: departure,
                            autoArrival: autoArrival,
                            autoDepart: autoDepart,
                            stopType: stopType
                        });
                    }
                    else if(stopType == 'Current'){
                        trainHistory.push({
                            locationCode: locationCode,
                            locationFullName: locationFullName,
                            locationOrder: locationOrder,
                            locationType: locationType,
                            origin: trainOrigin,
                            destination: trainDestination,
                            scheduledArrival: scheduledArrival,
                            scheduledDeparture: scheduledDeparture,
                            expectedArrival: expectedArrival,
                            expectedDeparture: expectedDeparture,
                            arrival: arrival,
                            autoArrival: autoArrival,
                            stopType: stopType
                        });
                    }
                    else if(stopType == 'Next'){
                        trainHistory.push({
                            locationCode: locationCode,
                            locationFullName: locationFullName,
                            locationOrder: locationOrder,
                            locationType: locationType,
                            origin: trainOrigin,
                            destination: trainDestination,
                            scheduledArrival: scheduledArrival,
                            scheduledDeparture: scheduledDeparture,
                            expectedArrival: expectedArrival,
                            expectedDeparture: expectedDeparture,
                            stopType: stopType
                        });
                    }
                    else if(stopType == 'Future'){
                        trainHistory.push({
                            locationCode: locationCode,
                            locationFullName: locationFullName,
                            locationOrder: locationOrder,
                            locationType: locationType,
                            origin: trainOrigin,
                            destination: trainDestination,
                            scheduledArrival: scheduledArrival,
                            scheduledDeparture: scheduledDeparture,
                            expectedArrival: expectedArrival,
                            expectedDeparture: expectedDeparture,
                            stopType: stopType
                        });
                    }
                    else{
                        trainHistory.push({
                            locationCode: locationCode,
                            locationFullName: locationFullName,
                            locationOrder: locationOrder,
                            locationType: locationType,
                            origin: trainOrigin,
                            destination: trainDestination,
                            scheduledArrival: scheduledArrival,
                            scheduledDeparture: scheduledDeparture,
                            expectedArrival: expectedArrival,
                            expectedDeparture: expectedDeparture,
                            arrival: arrival,
                            departure: departure,
                            autoArrival: autoArrival,
                            autoDepart: autoDepart,
                            stopType: stopType
                        });
                    }
                    break;

                case 'Timing Point':
                    trainHistory.push({
                        locationCode: locationCode,
                        locationFullName: locationFullName,
                        locationOrder: locationOrder,
                        locationType: locationType,
                        origin: trainOrigin,
                        destination: trainDestination,
                        scheduledArrival: scheduledArrival,
                        expectedArrival: expectedArrival,
                        stopType: stopType
                    });
                    break;

                default:
                trainHistory.push({
                    locationCode: locationCode,
                    locationFullName: locationFullName,
                    locationOrder: locationOrder,
                    locationType: locationType,
                    origin: trainOrigin,
                    destination: trainDestination,
                    scheduledArrival: scheduledArrival,
                    scheduledDeparture: scheduledDeparture,
                    expectedArrival: expectedArrival,
                    expectedDeparture: expectedDeparture,
                    arrival: arrival,
                    departure: departure,
                    autoArrival: autoArrival,
                    autoDepart: autoDepart,
                    stopType: stopType
                });
                break;
            }

        }

        return trainHistory;
    }
}