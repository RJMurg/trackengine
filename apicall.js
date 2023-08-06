const axios = require('axios');
const parser = require('./parser');

const APIBase = "http://api.irishrail.ie/realtime/realtime.asmx/"

// Get all stations
module.exports = {
    getStations: async () =>{
        const response = await axios.get(APIBase + "getAllStationsXML");
        const data = parser.parseXML(response.data);
        const stations = parser.parseStations(data.ArrayOfObjStation.objStation);
        return stations;
    },

    stationExistsCode: async (stationCode) =>{
        const stations = await module.exports.getStations();
        for(let i = 0; i < stations.length; i++){
            if(stations[i].code.toLowerCase() == stationCode.toLowerCase()){
                return true;
            }
        }
        return false;
    },

    getStationsFilter: async (stationFilter) =>{
        const response = await axios.get(APIBase + "getStationsFilterXML?StationText=" + stationFilter);
        const data = parser.parseXML(response.data);

        if(data.ArrayOfObjStationFilter.objStationFilter == undefined){
            return 'No stations found';
        }
        
        const stations = parser.parseStationsFilter(data.ArrayOfObjStationFilter.objStationFilter);

        return stations;
    },

    stationExistsName: async (stationName) =>{
        const stations = await module.exports.getStations();
        for(let i = 0; i < stations.length; i++){
            if(stations[i].name.toLowerCase() == stationName.toLowerCase){
                return true;
            }
        }
        return false;
    },

    getStationsType: async (stationType) =>{
        switch(stationType.toLowerCase()){
            case "main":
            case "mainline":
            case "m":
                stationType = "M";
                break;

            case "suburban":
            case "sub":
            case "s":
                stationType = "S";
                break;

            case "dart":
            case "d":
                stationType = "D";
                break;

            case "all":
            case "a":
                stationType = "A";
                break;

            default:
                stationType = "A";
                break;
        }

        const response = await axios.get(APIBase + "getAllStationsXML_WithStationType?StationType=" + stationType);
        const data = parser.parseXML(response.data);
        const stations = parser.parseStations(data.ArrayOfObjStation.objStation);
        return stations;
    },

    getStationCode: async (stationCode, time) =>{
        if(time == undefined){
            time = 90;
        }

        const response = await axios.get(APIBase + "getStationDataByCodeXML_WithNumMins?StationCode=" + stationCode + "&NumMins=" + time);
        const data = parser.parseXML(response.data);
        const trains = parser.parseTrainsByStation(data.ArrayOfObjStationData.objStationData);
        return trains;
    },

    getStationName: async (stationName, time) =>{
        if(time == undefined){
            time = 90;
        }
        const response = await axios.get(APIBase + "getStationDataByNameXML_withNumMins?StationDesc=" + stationName + "&NumMins=" + time);
        const data = parser.parseXML(response.data);
        const trains = parser.parseTrainsByStation(data.ArrayOfObjStationData.objStationData);

        return trains;
    },

    getTrains: async () =>{
        const response = await axios.get(APIBase + "getCurrentTrainsXML");
        const data = parser.parseXML(response.data);
        const trains = parser.parseTrains(data.ArrayOfObjTrainPositions.objTrainPositions);
        return trains;
    },

    getTrainsByStation: async (stationCode, numMins) =>{
        const response = await axios.get(APIBase + "getStationDataByCodeXML_WithNumMins?StationCode=" + stationCode) + "&NumMins=" + numMins;
        const data = parser.parseXML(response.data);
        return data.ArrayOfObjStation.objStation;
    },

    getTrainID: async (trainID) =>{
        const trains = await module.exports.getTrains();
        for(let i = 0; i < trains.length; i++){
            if(trains[i].trainCode.toLowerCase() == trainID.toLowerCase()){
                return trains[i];
            }
        }

        return 'Train not found'
    },

    getTrainType: async (trainType) =>{
        switch(trainType.toLowerCase()){
            case "main":
            case "mainline":
            case "m":
                trainType = "M";
                break;

            case "suburban":
            case "sub":
            case "s":
                trainType = "S";
                break;

            case "dart":
            case "d":
                trainType = "D";
                break;

            case "all":
            case "a":
                trainType = "A";
                break;

            default:
                return 'Invalid train type'
                break;
        }

        const response = await axios.get(APIBase + "getCurrentTrainsXML_WithTrainType?TrainType=" + trainType);
        const data = parser.parseXML(response.data);
        const trains = parser.parseTrains(data.ArrayOfObjTrainPositions.objTrainPositions);
        return trains;
    },

    getRoutes: async () =>{
        // This looks at all trains and creates a list of all unique routes
        // Each route contains the following:
        // - Origin
        // - Destination
        // - Direction
        // - Amount of trains on the route

        const trains = await module.exports.getTrains();
        let routes = [];

        for(let i = 0; i < trains.length; i++){
            let routeExists = false;
            for(let j = 0; j < routes.length; j++){
                if(trains[i].origin == routes[j].origin && trains[i].destination == routes[j].destination && trains[i].direction == routes[j].direction){
                    routes[j].amount++;
                    routeExists = true;
                }
            }

            if(!routeExists){
                routes.push({
                    origin: trains[i].origin,
                    destination: trains[i].destination,
                    direction: trains[i].direction,
                    amount: 1
                });
            }
        }

        return routes;
    },

    getTrainHistory: async (trainID, date, type) =>{
        // Dates will arrive in the format of DD-MM-YYYY
        // We need to convert it to "DD Mon YYYY" for the API
        // I.e. 01-01-2020 -> 01 Jan 2020

        const dateSplit = date.split('-');
        const day = dateSplit[0];
        const month = dateSplit[1];
        const year = dateSplit[2];

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"];

        const newDate = day + " " + months[month - 1] + " " + year;

        let include = false;

        if(type == undefined || type.toLowerCase() == "all" || type.toLowerCase() == "a"){
            include = true;
        }
        else if(type.toLowerCase() == "stops" || type.toLowerCase() == "s"){
            include = false;
        }

        const response = undefined;

        try{
            response = await axios.get(APIBase + "getTrainMovementsXML?TrainId=" + trainID + "&TrainDate=" + newDate);
        }
        catch(err){
            return 'Train not found';
        }

        const data = parser.parseXML(response.data);
        const train = parser.parseTrainHistory(data.ArrayOfObjTrainMovements.objTrainMovements, include);

        return train;
    }
}
