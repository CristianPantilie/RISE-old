import * as types from '../constants/types';
import _ from 'lodash';
import moment from 'moment';

const INITIAL_STATE = {
    layers: [],
    regions: [],
    features: [],
    stations: [],
    timeSeriesData: {},
    coordinates: [],
    showDateRangeModal: false,
    timeSeriesUrl: '',
    error: null
};

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case types.INITIALIZE_MAP:
            const { regions } = action.payload;
            return { ...state, regions, error: null, showDateRangeModal: false };

        case types.MAP_ERROR:
            return { ...state, error: action.payload, showDateRangeModal: false };

        case types.FEATURES:
            const { features, coordinates } = action.payload;

            return { ...state, error: null, features, coordinates, showDateRangeModal: false };

        case types.CLEAR_TIME_SERIES:
            return { ...state, timeSeriesData: {}, features: []};

        case types.TIME_SERIES:
            const { data, sensor } = action.payload;

            const timeSeries = _.map(data, (points, index) => {
                const series = _.map(points, (point) => {
                    const value = (value, x1, y1, x2, y2) => (parseFloat(value) - parseFloat(x1)) * (parseFloat(y2) - parseFloat(x2)) / (parseFloat(y1) - parseFloat(x1)) + parseFloat(x2);
                    let val = point.value;

                    if (sensor.min !== null && sensor.min !== undefined && sensor.max !== null && sensor.max !== undefined) {
                        val = value(point.value, 0, 255, sensor.min, sensor.max).toFixed(2);
                    }

                    return [moment(point.timestamp), val];
                });

                //console.log(series);

                return {
                    name: index,
                    data: series
                }

            });

            //console.log("SERIES", timeSeries);

            const timeSeriesData = {
                options: {
                    chart: {
                        stacked: false,
                        zoom: {
                            type: 'x',
                            enabled: true
                        }
                    },
                    plotOptions: {
                        line: {
                            curve: 'smooth',
                        }
                    },
                    dataLabels: {
                        enabled: false
                    },

                    markers: {
                        size: 0,
                        style: 'full',
                    },
                    //colors: ['#0165fc'],
                    title: {
                        text: sensor.name,
                        align: 'left'
                    },
                    yaxis: {
                        title: {
                            text: 'Value'
                        },
                        min: (sensor.min) ? parseFloat(sensor.min) : undefined,
                        max: (sensor.max) ? parseFloat(sensor.max) : undefined
                    },
                    xaxis: {
                        type: 'datetime',
                    },
                    tooltip: {
                        x: {
                            format: 'dd.MM.yyyy',
                        },
                    },
                },
                series: timeSeries,
            };

            return { ...state, error: null, timeSeriesData };

        case types.CLEAR_DATA:
            return { ...state, layers: [], features: [], error: null, showDateRangeModal: false };

        case types.SET_PIXELS:
            return { ...state, coordinates: action.payload, showDateRangeModal: false };

        case types.SHOW_DATE_RANGE_PICKER:
            console.log('P',action.payload);
            return { ...state, coordinates: action.payload.coordinates, timeSeriesUrl: action.payload.url, showDateRangeModal: true};

        case types.SENSOR_STATIONS:
            return { ...state, stations: action.payload, showDateRangeModal: false };

        case types.SENSOR_STATIONS_ERROR:
            return { ...state, error: action.payload, showDateRangeModal: false };

        default:
            return state;
    }
};
