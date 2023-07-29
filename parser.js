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
            let rawPublicMessage = trains[train].PublicMessage._text;
            let publicMessage = rawPublicMessage.split('\\n');
            let departureTime = publicMessage[1].split(' - ')[0];
            let origin = publicMessage[1].split(' - ')[1].split(' to ')[0];
            let destination = publicMessage[1].split(' - ')[1].split(' to ')[1].split(' (')[0];
            let delay = publicMessage[1].split(' - ')[1].split(' (')[1].split(' mins')[0];
            let currentStatus = publicMessage[2];
            let direction = trains[train].Direction._text;
            let latitude = trains[train].TrainLatitude._text;
            let longitude = trains[train].TrainLongitude._text;

            trainList.push({
                latitude: latitude,
                longitude: longitude,
                publicMessage: rawPublicMessage,
                departureTime: departureTime,
                origin: origin,
                destination: destination,
                delay: delay,
                currentStatus: currentStatus,
                direction: direction
            });
        }

        return trainList;

    }
}