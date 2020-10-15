import * as types from '../constants/types';
import _ from 'lodash';

const INITIAL_STATE = {
    categories: [],
    error: null
};

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case types.CATEGORIES:
            const { categories } = action.payload;
            return { ...state, categories, error: null };

        case types.DATA_ERROR:
            return { ...state, error: action.payload };

        default:
            return state;
    }
};
