import React, {Component} from 'react';
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import Calendar from 'react-calendar';
import moment from 'moment';
import Swal from 'sweetalert2';
import _ from 'lodash';

import { getSensorData, getAvailableDates } from "../../actions/AppActions";
import { prepareSensorTimeSeries } from "../../actions/MapActions";

class SideNav extends Component {
    constructor(props) {
        super(props);

        const { showRegions, showStations } = props;

        this.state = {
            showRegions,
            showStations,
            categories: [],
            regions: [],
            selectedRegion: null,
            selectedSensor: null,
            date: null,
            availableDates: [],
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps !== this.props) {
            const { showRegions, showStations, categories, regions, sensor, availableDates } = this.props;
            this.setState({
                showRegions,
                showStations,
                categories,
                regions,
                selectedSensor: sensor,
                availableDates
            });
        }
    }

    handleRegionChange(e) {
        const regionId = e.target.value;
        if (regionId) {
            this.setState({
                selectedRegion: regionId
            });
        } else {
            this.setState({
                selectedRegion: null,
                selectedSensor: null,
                availableDates: [],
            });
        }
    }

    handleSensorClick(id, latitude, longitude) {
        const { getAvailableDates, showDateRangePickerModal, prepareSensorTimeSeries, getSensorData } = this.props;
        this.setState({
            availableDates: [],
        });

        if (latitude && longitude) {
            latitude = parseFloat(latitude);
            longitude = parseFloat(longitude);

            if (!isNaN(latitude) && !isNaN(longitude)) {
                getSensorData(id);
                prepareSensorTimeSeries([latitude, longitude]);
                showDateRangePickerModal();
            }
        }

        getAvailableDates(id);
    }

    handleDateChange(date) {
        const { selectedSensor } = this.state;
        const { getSensorData } = this.props;
        getSensorData(selectedSensor, date);
        this.setState({
            date
        });
    }

    handleFeatureInfoClick(e) {
        const { handleFeatureInfoClick } = this.props;
        Swal.fire({
            position: 'top-start',
            text: 'Click on a point to retrieve features information',
            type: 'info',
            confirmButtonText: 'Continue'
        }).then((result) => {
            handleFeatureInfoClick();
        });
    }

    handleTimeSeriesClick(e) {
        const { handleTimeSeriesClick } = this.props;
        //console.log(this.props);
        Swal.fire({
            position: 'top-start',
            text: 'Click on a point to retrieve time series information',
            type: 'info',
            confirmButtonText: 'Continue'
        }).then((result) => {
            handleTimeSeriesClick();
        });
    }

    handleCancelSelectionClick(e) {
        const { handleCancelSelectionClick } = this.props;
        Swal.fire({
            position: 'top-start',
            text: 'Are you sure you want to cancel the selection?',
            type: 'warning',
            confirmButtonText: 'Continue',
            showCancelButton: true
        }).then((result) => {
            if (result.value) {
                this. setState({
                    selectedRegion: null,
                    selectedSensor: null,
                    date: null,
                    availableDates: [],
                });
                handleCancelSelectionClick();
            }
        });
    }

    handleDataSourceClick(e) {
        const { latitude, longitude, id } = e.target.dataset;
        const { showStation } = this.props;

        if (latitude && longitude && id) {
            showStation(id);
        }

        this.setState({
            selectedSensor: null,
        });
    }

    renderSensors(sensors, latitude, longitude) {
        const { selectedSensor } = this.state;
        if (sensors && sensors.length > 0) {
            //console.log(sensors);
            const sensorsData = sensors.map((sensor, index) => {
                return (
                    <li className={`list-group-item cursor-pointer ${(sensor.data_points_number === 0) ? 'disabled' : ''} ${(selectedSensor === sensor.id) ? 'active' : ''}`} key={index} onClick={() => {
                        if (sensor.data_points_number > 0) {
                            this.handleSensorClick(sensor.id, latitude, longitude);
                        }
                    }}>
                        <div className="text-center">{sensor.name}</div>
                    </li>
                );
            });

            return (
                <div className="form-group">
                    <ul className="list-group">
                        {sensorsData}
                    </ul>
                </div>
            );
        } else {
            return null;
        }
    }

    renderButtons(graph) {
        const { date } = this.state;
        if (date) {
            return (
                <div className="form-group">
                    <div className="btn-toolbar" role="toolbar" aria-label="Actions">
                        <div className="btn-group mr-2" role="group" aria-label="Get info">
                            <button type="button" className="btn btn-outline-primary" title="Get features info" onClick={this.handleFeatureInfoClick.bind(this)}>
                                <i className="fa fa-info-circle" />
                            </button>
                        </div>

                        {(graph > 0) && (
                        <div className="btn-group mr-2" role="group" aria-label="Get time series">
                            <button type="button" className="btn btn-outline-primary" title="Create time series" onClick={this.handleTimeSeriesClick.bind(this)}>
                                <i className="fa fa-line-chart" />
                            </button>
                        </div>
                        )}

                        <div className="btn-group mr-2" role="group" aria-label="Clear selection">
                            <button type="button" className="btn btn-outline-danger" title="Clear selection" onClick={this.handleCancelSelectionClick.bind(this)}>
                                <i className="fa fa-times-circle" />
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    }

    renderCalendar(sensor) {
        const { selectedSensor, date, availableDates } = this.state;
        if (selectedSensor) {
            return (
                <div>
                    <div className="form-group">
                        <Calendar
                            onChange={this.handleDateChange.bind(this)}
                            value={date}
                            minDetail="decade"
                            tileDisabled={({activeStartDate, date, view }) => {
                                const hasData = availableDates.filter((availableDate) => {
                                    if (view === 'month') {
                                        return moment(date).isSame(availableDate);
                                    } else if (view === 'year') {
                                        return moment(date).isSame(availableDate, 'month');
                                    } else {
                                        return moment(date).isSame(availableDate, 'year');
                                    }
                                });
                                return hasData.length === 0;
                            }}
                        />
                    </div>
                    {this.renderButtons(sensor && sensor.graph)}
                </div>
            );
        }
        return null;
    }

    renderDataSources(dataSources, id) {
        const { selectedSensor } = this.state;
        const sourcesData = dataSources.map((source, index) => {
            return (
                <div key={index}>
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="form-group">
                                <button className="btn btn-outline-secondary btn-block" type="button"
                                        disabled={(source.sensors.length === 0)}
                                        data-toggle="collapse"
                                        data-target={`#collapse${source.slug}${id}`} aria-expanded="false"
                                        data-latitude={source.latitude}
                                        data-longitude={source.longitude}
                                        data-id={source.id}
                                        aria-controls={`collapse${source.slug}${id}`}
                                        onClick={this.handleDataSourceClick.bind(this)}>
                                    {source.name}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="collapse" id={`collapse${source.slug}${id}`} data-parent={`#sources${id}`}>
                                {this.renderSensors(source.sensors, source.latitude, source.longitude)}
                                {(!source.latitude && !source.longitude) && this.renderCalendar(_.find(source.sensors, ['id', selectedSensor]))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        });
        return (
            <div className="accordion" id={`sources${id}`}>
                {sourcesData}
            </div>
        );
    }

    renderCategories() {
        const { categories, selectedRegion, showStations } = this.state;
        const { handleStationsToggleClick } = this.props;
        if (selectedRegion) {
            const categoriesData = categories.map((category, index) => {
                const dataSources = category.data_sources.filter(ds => {
                    return (ds.region_id && ds.region_id.toString() === selectedRegion);
                });
                return (
                    <div key={index}>
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <button className="btn btn-outline-dark btn-block" type="button"
                                            disabled={(dataSources.length === 0)}
                                            data-toggle="collapse"
                                            data-target={`#collapse${category.slug}`} aria-expanded="false"
                                            aria-controls={`collapse${category.slug}`}>
                                        {category.name}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="collapse" id={`collapse${category.slug}`} data-parent="#categories">
                                    {category.require_coordinates === 1 && (
                                        <div className="form-group">
                                            <button type="button" className="btn btn-primary btn-block" onClick={() => handleStationsToggleClick(selectedRegion, category.id)}>{(showStations) ? 'Hide' : 'Show'} stations</button>
                                            <hr />
                                        </div>
                                    )}
                                    {this.renderDataSources(dataSources, category.id)}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            });
            return (
                <div className="accordion" id="categories">
                    {categoriesData}
                </div>
            );
        } else {
            return null;
        }
    }

    renderRegions() {
        const { regions, selectedRegion } = this.state;
        const regionsData = regions.map((region, index) => {
            return (
                <option key={index} value={region.id}>
                    {region.name}
                </option>
            );
        });
        return(
            <div className="row">
                <div className="col-sm-12">
                    <div className="form-group">
                        <select className="form-control" ref="regions" onChange={this.handleRegionChange.bind(this)} value={(selectedRegion) ? selectedRegion : ''}>
                            <option value="">(Select region)</option>
                            {regionsData}
                        </select>
                        <hr />
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const { showRegions } = this.state;
        const { handleRegionsToggleClick } = this.props;
        return (
            <div className="sidebar">
                <div className="row">
                    <div className="col-sm-12">
                        <div className="form-group">
                            <button type="button" className="btn btn-primary btn-block" onClick={handleRegionsToggleClick}>{(showRegions) ? 'Hide' : 'Show'} regions</button>
                        </div>
                    </div>
                </div>
                {this.renderRegions()}
                {this.renderCategories()}
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    const { regions, layers } = state.MapReducer;
    const { categories } = state.AppReducer;
    const { sensor, availableDates } = state.DataReducer;

    return {
        regions,
        layers,
        categories,
        sensor,
        availableDates
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        getSensorData,
        getAvailableDates,
        prepareSensorTimeSeries
    }, dispatch);
};


export default connect(mapStateToProps, mapDispatchToProps)(SideNav);