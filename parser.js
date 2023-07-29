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
                latitude: station.StationLatitude._text,
                longitude: station.StationLongitude._text
            });
        });

        return stationList;
    },

    parseTrains: function(trains) {

        let trainList = [];
        for (let train in trains) {

            let latitude = trains[train].TrainLatitude._text;
            let longitude = trains[train].TrainLongitude._text;
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
                delay = delayString[0];

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
                delay = delayString[0];

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
                    departureTime: departureTime,
                    delay: delay,
                    currentMessage: currentMessage,
                    latitude: latitude,
                    longitude: longitude,
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
                    departureTime: departureTime,
                    latitude: latitude,
                    longitude: longitude,
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
                    departureTime: departureTime,
                    delay: delay,
                    terminatedTime: terminatedTime,
                    latitude: latitude,
                    longitude: longitude,
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
                    departureTime: departureTime,
                    delay: delay,
                    terminatedTime: terminatedTime,
                    currentMessage: currentMessage,
                    latitude: latitude,
                    longitude: longitude,
                    publicMessage: rawPublicMessage
                });
            }

        }

        return trainList;

    }
}