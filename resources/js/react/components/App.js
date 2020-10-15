import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import TopNav from './navigation/TopNav';
import Map from './map/Map';

import { initializeMap, getTimeSeries, clearTimeSeries, getAvailableStations, displayStation } from '../actions/MapActions';
import { getCategories, clearData } from '../actions/AppActions';
import SideNav from './navigation/SideNav';
import FeaturesModal from './modals/FeaturesModal';
import DateRangeModal from './modals/DateRangeModal';

class App extends Component {
    constructor(props) {
        super(props);

        props.initializeMap();
        props.getCategories();

        this.state = {
            error: null,
            showRegions: true,
            showStations: false,
            categories: [],
            featureInfo: false,
            timeSeries: false,
            features: [],
            coordinates: [],
            showFeaturesModal: false,
            showDateRangeModal: false,
            availableDates: [],
            timeSeriesUrl: '',
            sensorData: {},
            timeSeriesData: {},
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props !== prevProps) {
            const { categories, features, coordinates, availableDates, timeSeriesUrl, sensorData, timeSeriesData } = this.props;
            this.setState({
                categories,
                features,
                coordinates,
                showFeaturesModal: (features && features.length > 0),
                availableDates,
                timeSeriesUrl,
                sensorData,
                timeSeriesData
            });
        }
    }

    handleRegionsToggleClick() {
        this.setState({
            showRegions: !this.state.showRegions
        });
    }

    handleStationsToggleClick(region, category) {
        const { getAvailableStations } = this.props;
        if (!this.state.showStations) {
            getAvailableStations(region, category);
        }
        this.setState({
            showStations: !this.state.showStations
        });
    }

    handleFeatureInfoClick() {
        this.setState({
            featureInfo: true,
            timeSeries: false
        });
    }

    handleTimeSeriesClick() {
        this.setState({
            featureInfo: false,
            timeSeries: true
        });
    }

    handleCancelSelectionClick() {
        const { clearData } = this.props;

        clearData();

        this.setState({
            featureInfo: false,
            timeSeries: false,
            showStations: false
        });
    }

    handleModalClose() {
        const { clearTimeSeries } = this.props;

        clearTimeSeries();

        this.setState({
            showFeaturesModal: false,
            showDateRangeModal: false,
            timeSeriesData: {},
            timeSeriesUrl: '',
            availableDates: [],
            coordinates: [],
            sensorData: {},
        });
    }

    showStation(id) {
        const { displayStation } = this.props;

        displayStation(id);

        this.setState({
            showStations: true
        });
    }

    showDateRangePickerModal() {
        this.setState({
            showFeaturesModal: false,
            showDateRangeModal: true,
        })
    }

    renderError() {
        const {error} = this.state;

        if (error) {
            return (
                <div className="alert alert-danger alert-dismissible">
                    {(error.message) ? error.message : 'Unexpected error'}
                    <button type="button" className="close" onClick={this.handleDismissError.bind(this)}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            );
        }
    }

    render() {
        const { getTimeSeries } = this.props;
        const { showRegions, showStations, featureInfo, timeSeries, showFeaturesModal, showDateRangeModal, features, coordinates, availableDates, timeSeriesUrl, sensorData, timeSeriesData } = this.state;

        return (
            <div>
                <TopNav/>
                <Map
                    { ... this.props }
                    showRegions={showRegions}
                    showStations={showStations}
                    featureInfo={featureInfo}
                    timeSeries={timeSeries}
                    showDateRangePickerModal={this.showDateRangePickerModal.bind(this)}
                />
                <SideNav
                    showRegions={showRegions}
                    showStations={showStations}
                    handleRegionsToggleClick={this.handleRegionsToggleClick.bind(this)}
                    handleStationsToggleClick={this.handleStationsToggleClick.bind(this)}
                    handleFeatureInfoClick={this.handleFeatureInfoClick.bind(this)}
                    handleTimeSeriesClick={this.handleTimeSeriesClick.bind(this)}
                    handleCancelSelectionClick={this.handleCancelSelectionClick.bind(this)}
                    showDateRangePickerModal={this.showDateRangePickerModal.bind(this)}
                    showStation={this.showStation.bind(this)}
                />
                <div id="mouse-position" />
                <FeaturesModal
                    visible={showFeaturesModal}
                    features={features}
                    coordinates={coordinates}
                    handleModalClose={this.handleModalClose.bind(this)}
                />
                <DateRangeModal
                    visible={showDateRangeModal}
                    dates={availableDates}
                    coordinates={coordinates}
                    getTimeSeries={getTimeSeries}
                    url={timeSeriesUrl}
                    sensor={sensorData}
                    timeSeriesData={timeSeriesData}
                    handleModalClose={this.handleModalClose.bind(this)}
                />
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    const { regions, layers, error, features, coordinates, timeSeriesUrl, timeSeriesData } = state.MapReducer;
    const { categories } = state.AppReducer;
    const { availableDates, sensorData } = state.DataReducer;

    return {
        regions,
        layers,
        error,
        categories,
        features,
        coordinates,
        availableDates,
        timeSeriesUrl,
        sensorData,
        timeSeriesData
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        initializeMap,
        getCategories,
        clearData,
        getTimeSeries,
        clearTimeSeries,
        getAvailableStations,
        displayStation
    }, dispatch);
};


export default connect(mapStateToProps, mapDispatchToProps)(App);
