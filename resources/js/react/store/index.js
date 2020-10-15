import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import logger from 'redux-logger';
import reducers from '../reducers';

export default () => {
    // Middleware and store enhancers
    const enhancers = [
        applyMiddleware(thunk, logger)
    ];

    return createStore(reducers, {}, compose(...enhancers));
}