import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import {fromLonLat, toLonLat} from 'ol/proj';

import BingMaps from "ol/source/BingMaps";

import { GEOSERVER_WORKSPACE, GEOSERVER_WMS_URL } from '../../constants/constants';
import { getFeatures, setPixels, prepareTimeSeries } from '../../actions/MapActions';
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import {defaults as defaultControls} from 'ol/control';
import MousePosition from 'ol/control/MousePosition';
import {createStringXY} from 'ol/coordinate';

import marker from '../../../../images/marker-32.png';
import Overlay from "ol/Overlay";

class MapView extends Component {
    constructor(props) {
        super(props);
 
        const { showRegions, showStations } = props;

        this.state = {
            map: null,
            popup: null,
            regions: [],
            error: null,
            projection: null,
            sensorData: {},
            showRegions,
            showStations,
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { regions, error, showRegions, showStations, sensorData, stations } = this.props;
        const layers = [];
        const { map, projection } = this.state;

        if (prevProps !== this.props) {
            if (map) {
                if (prevProps.sensorData !== sensorData) {
                    if (sensorData && sensorData.data) {
                        const mapLayer = map.getLayers().getArray().reduce( (mapLayer, layer) => {
                            if (layer && layer.get('layer_type') === 'layer') {
                                return layer;
                            }
                        }, null);

                        const layerName = sensorData.data.reduce((layerName, data) => {
                            if (data.layer) {
                                return data.layer;
                            }
                        }, null);

                        // Add new layer or remove it from the map
                        if (layerName) {
                            if (!mapLayer){
                                const layer = new TileLayer({
                                    opacity: 1,
                                    zIndex: 5,
                                    source: new TileWMS({
                                        url: GEOSERVER_WMS_URL,
                                        params: {
                                            'LAYERS': GEOSERVER_WORKSPACE + ':' + layerName,
                                            'TILED': true
                                        },
                                        serverType: 'geoserver',
                                        // Countries have transparency, so do not fade tiles:
                                        transition: 0,
                                        crossOrigin: 'anonymous'
                                    })
                                });

                                layer.set('name', layerName);
                                layer.set('layer_type', 'layer');

                                map.addLayer(layer);
                            } else {
                                mapLayer.setSource(new TileWMS({
                                    url: GEOSERVER_WMS_URL,
                                    params: {
                                        'LAYERS': GEOSERVER_WORKSPACE + ':' + layerName,
                                        'TILED': true
                                    },
                                    serverType: 'geoserver',
                                    // Countries have transparency, so do not fade tiles:
                                    transition: 0,
                                    crossOrigin: 'anonymous'
                                }));

                                mapLayer.set('name', layerName);
                            }
                        }
                    } else {
                        const mapLayers = map.getLayers().getArray();
                        // Loop through layers in reverse so as to not change the collection while looping. Slice creates a shallow copy of the array
                        mapLayers.slice().reverse().forEach(layer => {
                            if (layer && layer.get('layer_type') !== undefined && layer.get('layer_type') === 'layer') {
                                map.removeLayer(layer);
                            }
                        });
                    }
                }

                if (showRegions) {
                    const mapRegions = map.getLayers().getArray().filter(layer => {
                        return (layer && layer.get('name') !== undefined && layer.get('layer_type') === 'region');
                    }).map(layer => {
                        return layer.get('name');
                    });

                    regions.forEach(region => {
                        if (!mapRegions.includes(region.name)) {
                            const layer = new TileLayer({
                                opacity: 0.5,
                                zIndex: 1,
                                source: new TileWMS({
                                    url: GEOSERVER_WMS_URL,
                                    params: {
                                        'LAYERS': GEOSERVER_WORKSPACE + ':' + region.layer,
                                        'TILED': true
                                    },
                                    serverType: 'geoserver',
                                    // Countries have transparency, so do not fade tiles:
                                    transition: 0,
                                    crossOrigin: 'anonymous'
                                })
                            });

                            layer.set('name', region.name);
                            layer.set('layer_type', 'region');

                            map.addLayer(layer);
                        }
                    });
                } else {
                    const mapLayers = map.getLayers().getArray();
                    // Loop through layers in reverse so as to not change the collection while looping. Slice creates a shallow copy of the array
                    mapLayers.slice().reverse().forEach(layer => {
                        if (layer && layer.get('layer_type') !== undefined && layer.get('layer_type') === 'region') {
                            map.removeLayer(layer);
                        }
                    });
                }

                if (showStations) {
                    if (stations && stations.length > 0) {

                        stations.forEach(station => {
                            if (station.latitude && station.longitude) {
                                const iconFeature = new Feature(new Point(fromLonLat([parseFloat(station.longitude), parseFloat(station.latitude)], projection)));

                                iconFeature.setStyle(new Style({
                                    image: new Icon({
                                        anchor: [0.5, 0.96],
                                        crossOrigin: 'anonymous',
                                        src: marker,
                                    })
                                }));

                                iconFeature.setId(station.id);
                                iconFeature.set('name', station.name);
                                iconFeature.set('description', station.description);

                                const stationLayer = new VectorLayer({
                                    zIndex: 10000,
                                    /*style: function (feature) {
                                        return feature.get('style');
                                    },*/
                                    source: new VectorSource({features: [iconFeature]})
                                });

                                stationLayer.set('name', station.name);
                                stationLayer.set('layer_type', 'station');

                                map.addLayer(stationLayer);
                            }
                        });
                    }
                } else {
                    const mapLayers = map.getLayers().getArray();
                    // Loop through layers in reverse so as to not change the collection while looping. Slice creates a shallow copy of the array
                    mapLayers.slice().reverse().forEach(layer => {
                        if (layer && layer.get('layer_type') !== undefined && layer.get('layer_type') === 'station') {
                            map.removeLayer(layer);
                        }
                    });
                }

            }

            this.setState({
                regions,
                error,
                showRegions,
                showStations,
                sensorData
            });
        }
    }

    componentDidMount() {
    	const mousePositionControl = new MousePosition({
	        coordinateFormat: createStringXY(4),
	        projection: 'EPSG:4326',
	        // comment the following two lines to have the mouse position
	        // be placed within the map.
	        className: 'mouse-position-display',
	        target: document.getElementById('mouse-position'),
	        undefinedHTML: '',
	      });

        const mapLayer = new TileLayer({
            source: new BingMaps({
                key: 'Arb2zbbz5JPMce3wh-a43F9un4KcQ_jB1PDc1pbGONpUpyWACZjQY8S5VC04LTTQ',
                imagerySet: 'Aerial',
                maxZoom: 19
            }),
            zIndex: 0
        });

        const projection = mapLayer.getSource().getProjection().getCode();

        // create map object with feature layer
        const map = new Map({
        	controls: defaultControls().extend([mousePositionControl]),
            target: this.refs.mapContainer,
            layers: [
                mapLayer
            ],
            view: new View({
                center: [3113606.157487862, 5665709.99275991],
                zoom: 8,
                //maxZoom: 11
            })
        });


        map.on('click', this.handleMapClick.bind(this));

        const popup = new Overlay({
            element:  this.refs.popoverContainer,
            positioning: 'bottom-center',
            stopEvent: false,
            offset: [0, -50]
        });

        map.addOverlay(popup);

        map.on('pointermove', function(evt) {
            map.getTargetElement().style.cursor =
                map.hasFeatureAtPixel(evt.pixel) ? 'pointer' : '';
        });

        // save map and layer references to local state
        this.setState({
            map,
            popup,
            projection
        });
    }

    handleMapClick(event) {
        const { map, popup, sensorData, popoverContainer } = this.state;
        const { getFeatures, featureInfo, timeSeries, prepareTimeSeries, showDateRangePickerModal } = this.props;

        const view = map.getView();
        const viewResolution = view.getResolution();
        const pixel = map.getEventPixel(event.originalEvent);
        const projection = view.getProjection();
        const coordinates = toLonLat(event.coordinate);

        const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
            return feature;
        });

        if (feature) {
            const coordinates = feature.getGeometry().getCoordinates();
            popup.setPosition(coordinates);

            const id = feature.getId();

            //console.log(id);

            this.refs.popoverContainer.innerHTML = '<h1>' + feature.get('name') + '</h1>' + feature.get('description');
            this.refs.popoverContainer.style.display = 'block';

        } else {
            this.refs.popoverContainer.innerHTML = "";
            this.refs.popoverContainer.style.display = 'none';
        }

        if (featureInfo) {
            map.forEachLayerAtPixel(pixel, function (layer) {
                const source = (layer.getVisible()) ? layer.getSource() : null;
                const type = layer.get('layer_type');

                if (type && type === 'layer' && source && source.getGetFeatureInfoUrl) {
                    const url = source.getGetFeatureInfoUrl(event.coordinate, viewResolution, projection, {
                        'INFO_FORMAT': 'application/json',
                        'FEATURE_COUNT': 50
                    });

                    if (url) {
                        getFeatures(url, coordinates);
                    }
                }
            });
        }

        if (timeSeries) {
            map.forEachLayerAtPixel(pixel, function (layer) {
                const source = (layer.getVisible()) ? layer.getSource() : null;
                const type = layer.get('layer_type');

                if (type && type === 'layer' && source && source.getGetFeatureInfoUrl) {
                    const url = source.getGetFeatureInfoUrl(event.coordinate, viewResolution, projection, {
                        'INFO_FORMAT': 'application/json',
                        'FEATURE_COUNT': 50
                    });

                    if (url) {
                        showDateRangePickerModal();
                        prepareTimeSeries(url, coordinates);
                    }
                }
            });
        }
    }

    render() {
        const { mapContainer } = styles;
        return (
            <div ref="mapContainer" style={mapContainer}>
                <div ref="popoverContainer" className="popoverContainer" />
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    const { sensorData } = state.DataReducer;
    const { stations } = state.MapReducer;

    return {
        sensorData,
        stations
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        getFeatures,
        setPixels,
        prepareTimeSeries
    }, dispatch);
};

const styles = {
    mapContainer: {
        width: '100%',
        height: '100%'
    }
};


export default connect(mapStateToProps, mapDispatchToProps)(MapView);
