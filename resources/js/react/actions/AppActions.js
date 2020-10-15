import axios from 'axios';
import moment from 'moment';

import { API_URL } from '../constants/constants';
import * as types from '../constants/types';

export function getCategories() {
    return dispatch => {
        axios({
            method: 'get',
            baseURL: API_URL,
            url: '/categories',
            timeout: 20000
        })
            .then(response => {
                // delete values from local
                if (response && response.data) {
                    dispatch({
                        type: types.CATEGORIES,
                        payload: response.data
                    });
                } else {
                    dispatch({
                        type: types.DATA_ERROR,
                        payload: {
                            message: 'Unexpected error'
                        }
                    });
                }
            })
            .catch(error => {
                dispatch({
                    type: types.DATA_ERROR,
                    payload: error
                });
            });
    }
}

export function getSensorData(id, date) {
    return dispatch => {
        if (id) {
            let timestamp = null;
            if (date) {
                timestamp = moment(date).format('YYYY-MM-DD');
            }
            axios({
                method: 'get',
                baseURL: API_URL,
                url: '/SENSOR_DATES-data/' + id + '/' + timestamp,
                timeout: 20000
            })
                .then(response => {
                    //console.log(response);
                    // delete values from local
                    if (response && response.data) {
                        dispatch({
                            type: types.SENSOR_DATA,
                            payload: response.data
                        });
                    } else {
                        dispatch({
                            type: types.DATA_ERROR,
                            payload: {
                                message: 'Unexpected error'
                            }
                        });
                    }
                })
                .catch(error => {
                    //console.log(error);
                    dispatch({
                        type: types.DATA_ERROR,
                        payload: error
                    });
                });
        } else {
            dispatch({
                type: types.DATA_ERROR,
                payload: {
                    message: 'Unexpected error'
                }
            });
        }
    }
}

export function getAvailableDates(id) {
    return dispatch => {
        if (id) {
            axios({
                method: 'get',
                baseURL: API_URL,
                url: '/dates/' + id,
                timeout: 20000
            })
                .then(response => {
                    // delete values from local
                    if (response && response.data) {
                        dispatch({
                            type: types.SENSOR_DATES,
                            payload: response.data
                        });
                    } else {
                        dispatch({
                            type: types.DATA_ERROR,
                            payload: {
                                message: 'Unexpected error'
                            }
                        });
                    }
                })
                .catch(error => {
                    //console.log(error);
                    dispatch({
                        type: types.DATA_ERROR,
                        payload: error
                    });
                });
        } else {
            dispatch({
                type: types.DATA_ERROR,
                payload: {
                    message: 'Unexpected error'
                }
            });
        }
    }
}

export function showSensorModal(id) {
    return dispatch => {
        if (id) {
            axios({
                method: 'get',
                baseURL: API_URL,
                url: '/sensor/' + id,
                timeout: 20000
            })
                .then(response => {
                    // delete values from local
                    if (response && response.data) {
                        dispatch({
                            type: types.SENSOR_STATION_DATA,
                            payload: response.data
                        });
                    } else {
                        dispatch({
                            type: types.DATA_ERROR,
                            payload: {
                                message: 'Unexpected error'
                            }
                        });
                    }
                })
                .catch(error => {
                    //console.log(error);
                    dispatch({
                        type: types.DATA_ERROR,
                        payload: error
                    });
                });
        } else {
            dispatch({
                type: types.DATA_ERROR,
                payload: {
                    message: 'Unexpected error'
                }
            });
        }
    }
}

export function clearData() {
    return {
        type: types.CLEAR_DATA,
        payload: null
    }
}