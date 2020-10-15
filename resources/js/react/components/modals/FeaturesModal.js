import React, {Component} from 'react';
import moment from 'moment';
import Loader from 'react-loaders';
import ReactJson from 'react-json-view';

class FeaturesModal extends Component {
    constructor(props) {
        super(props);
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
                    {this.renderFeatures()}
                </table>
            );
        }
        return null;
    }

    render() {
        const { visible, handleModalClose } = this.props;
        const { show } = styles;
        return (
            <div className="modal" tabIndex="-1" role="dialog" style={(visible) ? show : {}} onClick={handleModalClose}>
                <div className="modal-dialog modal-xl modal-dialog-scrollable" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Features information</h5>
                            <button type="button" className="close" aria-label="Close" onClick={handleModalClose}>
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            {this.renderCoordinates()}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={handleModalClose}>Close</button>
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

export default FeaturesModal;