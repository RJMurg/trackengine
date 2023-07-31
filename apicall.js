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

    getStationCode: async (stationCode) =>{
        const response = await axios.get(APIBase + "getStationDataByCodeXML?StationCode=" + stationCode);
        const data = parser.parseXML(response.data);
        const trains = parser.parseTrainsByStation(data.ArrayOfObjStationData.objStationData);
        return trains;
    },

    getStationName: async (stationName) =>{
        const response = await axios.get(APIBase + "getStationDataByNameXML?StationDesc=" + stationName);
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
    }
}
