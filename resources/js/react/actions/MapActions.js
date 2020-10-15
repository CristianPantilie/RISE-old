import axios from 'axios';
import parse from 'url-parse';

import { API_URL } from '../constants/constants';
import * as types from '../constants/types';

export function initializeMap() {
    return dispatch => {
        axios({
            method: 'get',
            baseURL: API_URL,
            url: '/map-data',
            timeout: 20000
        })
            .then(response => {
                // delete values from local
                if (response && response.data) {
                    dispatch({
                        type: types.INITIALIZE_MAP,
                        payload: response.data
                    });
                } else {
                    dispatch({
                        type: types.MAP_ERROR,
                        payload: {
                            message: 'Unexpected error'
                        }
                    });
                }
            })
            .catch(error => {
                dispatch({
                    type: types.MAP_ERROR,
                    payload: error
                });
            });
    }
}

export function getFeatures(url, coordinates) {
    return dispatch => {
        axios({
            method: 'post',
            baseURL: API_URL,
            url: '/features',
            data: {
                url
            },
            timeout: 20000
        })
            .then(response => {
                // delete values from local
                if (response && response.data) {
                    response.data.coordinates = coordinates;
                    dispatch({
                        type: types.FEATURES,
                        payload: response.data
                    });
                } else {
                    dispatch({
                        type: types.MAP_ERROR,
                        payload: {
                            message: 'Unexpected error'
                        }
                    });
                }
            })
            .catch(error => {
                dispatch({
                    type: types.MAP_ERROR,
                    payload: error
                });
            });
    }
}

export function setPixels(pixels) {
    return {
        type: types.SET_PIXELS,
        payload: pixels
    }
}

export function prepareTimeSeries(url, coordinates) {
    return {
        type: types.SHOW_DATE_RANGE_PICKER,
        payload: {
            url,
            coordinates
        }
    }
}

export function prepareSensorTimeSeries(coordinates) {
    return {
        type: types.SHOW_DATE_RANGE_PICKER,
        payload: {
            url: '',
            coordinates
        }
    }
}

export function clearTimeSeries() {
    return {
        type: types.CLEAR_TIME_SERIES,
        payload: null
    }
}

export function getTimeSeries(selectedDates, sensor, url) {
    if (url && url.length > 0) {
        const parsedUrl = parse(url, true);

        delete parsedUrl.query.LAYERS;
        delete parsedUrl.query.QUERY_LAYERS;

        url = parsedUrl.toString();
    }

    const dates = {};

    if (selectedDates) {
        dates.start = selectedDates.start.format('YYYY-MM-DD');
        dates.end = selectedDates.end.format('YYYY-MM-DD');
    }

    return dispatch => {
        axios({
            method: 'post',
            baseURL: API_URL,
            url: '/time-series',
            data: {
                url,
                sensor,
                dates
            },
            timeout: 60000
        })
            .then(response => {
                // delete values from local
                if (response && response.data) {
                    //console.log(response.data);
                    dispatch({
                        type: types.TIME_SERIES,
                        payload: {
                            data: response.data,
                            sensor
                        }
                    });
                } else {
                    dispatch({
                        type: types.MAP_ERROR,
                        payload: {
                            message: 'Unexpected error'
                        }
                    });
                }
            })
            .catch(error => {
                dispatch({
                    type: types.MAP_ERROR,
                    payload: error
                });
            });
    }
}

export function getAvailableStations(region, category) {
    return dispatch => {
        if (region && category) {
            axios({
                method: 'get',
                baseURL: API_URL,
                url: '/stations/' + region + '/' + category,
                timeout: 20000
            })
                .then(response => {
                    // delete values from local
                    if (response && response.data) {
                        //console.log(response.data);
                        dispatch({
                            type: types.SENSOR_STATIONS,
                            payload: response.data
                        });
                    } else {
                        dispatch({
                            type: types.SENSOR_STATIONS_ERROR,
                            payload: {
                                message: 'Unexpected error'
                            }
                        });
                    }
                })
                .catch(error => {
                    //console.log(error);
                    dispatch({
                        type: types.SENSOR_STATIONS_ERROR,
                        payload: error
                    });
                });
        } else {
            dispatch({
                type: types.SENSOR_STATIONS_ERROR,
                payload: {
                    message: 'Invalid parameters'
                }
            });
        }
    }
}

export function displayStation(id) {
    return dispatch => {
        if (id) {
            axios({
                method: 'get',
                baseURL: API_URL,
                url: '/station/' + id,
                timeout: 20000
            })
                .then(response => {
                    // delete values from local
                    if (response && response.data) {
                        //console.log(response.data);
                        dispatch({
                            type: types.SENSOR_STATIONS,
                            payload: response.data
                        });
                    } else {
                        dispatch({
                            type: types.SENSOR_STATIONS_ERROR,
                            payload: {
                                message: 'Unexpected error'
                            }
                        });
                    }
                })
                .catch(error => {
                    //console.log(error);
                    dispatch({
                        type: types.SENSOR_STATIONS_ERROR,
                        payload: error
                    });
                });
        } else {
            dispatch({
                type: types.SENSOR_STATIONS_ERROR,
                payload: {
                    message: 'Invalid parameters'
                }
            });
        }
    }
}