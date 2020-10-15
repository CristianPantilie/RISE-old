import * as types from '../constants/types';
import moment from 'moment';
import _ from 'lodash';

const INITIAL_STATE = {
    sensor: null,
    sensorData: {},
    availableDates: [],
    error: null
};

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case types.SENSOR_DATA:
            const { sensorData } = action.payload;
            return { ...state, sensorData, error: null };

        case types.SENSOR_DATES:
            const { dates, sensor } = action.payload;
            const availableDates = dates.map(date => {
                if (date && date.timestamp) {
                    return moment(date.timestamp, 'YYYY-MM-DD 00:00:00');
                }
            });

            return { ...state, availableDates, sensor, error: null };

        case types.DATA_ERROR:
            return { ...state, error: action.payload };

        case types.CLEAR_DATA:
            return INITIAL_STATE;

        default:
            return state;
    }
};
