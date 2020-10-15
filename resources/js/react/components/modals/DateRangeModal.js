import React, {Component} from 'react';
import moment from 'moment';
import Loader from 'react-loaders';
import ReactJson from 'react-json-view';
import DateRangePicker from 'react-daterange-picker';
import Chart from 'react-apexcharts';
import { css } from '@emotion/core';
import RingLoader from 'react-spinners/RingLoader';

const override = css`
    display: block;
    margin: 0 auto;
`;

class DateRangeModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedDates: null,
            togglePicker: false,
            loading: false
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { timeSeriesData } = this.props;
        const { togglePicker } = this.state;
        if (prevProps !== this.props) {
            if (timeSeriesData && timeSeriesData.options && timeSeriesData.series && !togglePicker) {
                this.setState({
                    loading: false
                });
            }
        }
    }

    onSelect(selectedDates) {
        this.setState({selectedDates});
    }

    onApply() {
        const { selectedDates } = this.state;
        const { getTimeSeries, coordinates, url, sensor } = this.props;

        console.log(sensor);

        if (selectedDates) {
            getTimeSeries(selectedDates, sensor, url);
        }

        this.setState({
            togglePicker: false,
            loading: true,
        });
    }

    togglePicker(togglePicker) {
        this.setState({
            togglePicker
        });
    }

    renderFeatures() {
        const { features } = this.props;
        if (features && features.length > 0) {
            const featuresData = features.map((feature, featureIndex) => {
                const {properties} = feature;
                return Object.keys(properties).map((name, propertyIndex) => {
                    return (
                        <tr key={featureIndex.toString() + propertyIndex.toString()}>
                            <th>{name}</th>
                            <td>{properties[name]}</td>
                        </tr>
                    );
                });
            });
            return (
                <tbody>
                    {featuresData}
                </tbody>
            );
        }
        return null;
    }

    renderCoordinates() {
        const { coordinates } = this.props;

        if (coordinates && coordinates.length === 2) {
            return (
                <table className="table table-striped">
                    <tbody>
                    <tr>
                        <th>Latitude</th>
                        <td>{coordinates[1].toFixed(6)}</td>
                    </tr>
                    <tr>
                        <th>Longitude</th>
                        <td>{coordinates[0].toFixed(6)}</td>
                    </tr>
                    </tbody>
                </table>
            );
        }
        return null;
    }

    renderDateRangePicker(minDate, maxDate) {
        const { togglePicker, selectedDates, loading } = this.state;
        const { dates, timeSeriesData } = this.props;

        if (dates && dates.length > 0) {
            return (
                <div>
                    {this.renderCoordinates()}
                    <div className="row">
                        <div className="col">
                            <h4>Select date range</h4>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-5">
                            <input type="text" className="form-control" readOnly placeholder="Start Date" value={(selectedDates && selectedDates.start) ? selectedDates.start.format('DD.MM.YYYY') : ""} onClick={() => this.togglePicker(true)} />
                        </div>
                        <div className="col-sm-5">
                            <input type="text" className="form-control" readOnly placeholder="End Date" value={(selectedDates && selectedDates.end) ? selectedDates.end.format('DD.MM.YYYY') : ""} onClick={() => this.togglePicker(true)} />
                        </div>
                        <div className="col-sm-2">
                            <button type="button" className="btn btn-block btn-primary" onClick={this.onApply.bind(this)}>
                                Apply
                            </button>
                        </div>
                    </div>
                    {togglePicker && (
                        <div className="row mt-2">
                            <div className="col-sm-12 text-center">
                                <DateRangePicker
                                    onSelect={this.onSelect.bind(this)}
                                    value={this.state.selectedDates}
                                    firstOfWeek={1}
                                    maximumDate={maxDate.toDate()}
                                    minimumDate={minDate.toDate()}
                                    initialYear={minDate.year()}
                                    initialMonth={minDate.month()}
                                    numberOfCalendars={2}
                                />
                            </div>
                        </div>
                    )}
                    {!loading && timeSeriesData && timeSeriesData.options && timeSeriesData.series && !togglePicker && (
                        <div className="row mt-4">
                            <div className="col">
                                <Chart
                                    options={timeSeriesData.options}
                                    series={timeSeriesData.series}
                                    type="line"
                                />
                            </div>
                        </div>
                    )}
                    {loading && (
                        <div className="row mt-4">
                            <div className="col">
                                <RingLoader
                                    css={override}
                                    sizeUnit={"px"}
                                    size={60}
                                    color={'#3490dc'}
                                    loading={loading}
                                />
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    }

    render() {
        const { visible, handleModalClose, dates } = this.props;
        const { show } = styles;
        const minDate = moment.min(dates);
        const maxDate = moment.max(dates);
        return (
            <div className="modal" tabIndex="-1" role="dialog" style={(visible) ? show : {}}>
                <div className="modal-dialog modal-xl modal-dialog-scrollable" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Timeseries ({minDate.format('DD.MM.YYYY')} - {maxDate.format('DD.MM.YYYY')})</h5>
                            <button type="button" className="close" aria-label="Close" onClick={handleModalClose}>
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            {this.renderDateRangePicker(minDate, maxDate)}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => {
                                this.setState({
                                    selectedDates: null,
                                    togglePicker: false
                                });
                                handleModalClose()
                            }}>Close</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const styles = {
    show: {
        display: 'block'
    },
};

export default DateRangeModal;