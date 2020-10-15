import { combineReducers } from 'redux';
import MapReducer from './MapReducer';
import AppReducer from './AppReducer';
import DataReducer from './DataReducer';

export default combineReducers({ MapReducer, AppReducer, DataReducer });