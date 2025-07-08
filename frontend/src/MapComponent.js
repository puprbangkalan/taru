// frontend/src/MapComponent.js
import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, GeoJSON, useMapEvents } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { supabase } from './supabaseClient'; // We'll create this file

// Fix for default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapComponent = () => {
    const featureGroupRef = useRef();
    const [drawnPolygon, setDrawnPolygon] = useState(null);
    const [intersectionResults, setIntersectionResults] = useState([]);
    const [mapInstance, setMapInstance] = useState(null);

    const onCreated = (e) => {
        const { layerType, layer } = e;
        if (layerType === 'polygon') {
            const geoJSON = layer.toGeoJSON();
            setDrawnPolygon(geoJSON);
        }
    };

    const onDeleted = (e) => {
        setDrawnPolygon(null);
        setIntersectionResults([]);
    };

    const handleCheckSpatialPlan = async () => {
        if (!drawnPolygon) {
            alert('Please draw a polygon first!');
            return;
        }

        try {
            // IMPORTANT: Replace 'YOUR_SUPABASE_PROJECT_REF' with your actual Supabase project reference
            // You can find this in your Supabase project URL: https://YOUR_SUPABASE_PROJECT_REF.supabase.co
            const { data, error } = await supabase.functions.invoke('check-tata-ruang', {
                body: { userPolygonGeoJSON: drawnPolygon },
            });


            if (error) {
                console.error('Error invoking Edge Function:', error);
                alert('Error checking spatial plan: ' + error.message);
                return;
            }

            setIntersectionResults(data);
        } catch (error) {
            console.error('Network or other error:', error);
            alert('An unexpected error occurred.');
        }
    };

    const handleClearMap = () => {
        if (featureGroupRef.current) {
            featureGroupRef.current.clearLayers();
        }
        setDrawnPolygon(null);
        setIntersectionResults([]);
    };

    const handleRedraw = () => {
        handleClearMap();
        alert('Map cleared. Please draw a new polygon.');
    };

    // Component to get map instance and set it
    const MapEvents = () => {
        const map = useMapEvents({});
        useEffect(() => {
            setMapInstance(map);
        }, [map]);
        return null;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <MapContainer
                center={[-7.1754, 112.9234]} // Bangkalan, East Java coordinates
                zoom={12}
                style={{ height: '70vh', width: '100%' }}
                whenCreated={setMapInstance}
            >
                <MapEvents />
                {/* Esri Satellite Basemap */}
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    maxZoom={19}
                />

                <FeatureGroup ref={featureGroupRef}>
                    <EditControl
                        position="topleft"
                        onCreated={onCreated}
                        onDeleted={onDeleted}
                        draw={{
                            rectangle: false,
                            circle: false,
                            marker: false,
                            polyline: false,
                            circlemarker: false,
                        }}
                    />
                </FeatureGroup>

                {/* Display intersected polygons on the map */}
                {intersectionResults.map((result, index) => (
                    <GeoJSON
                        key={index}
                        data={result.intersected_geom}
                        style={() => ({
                            color: 'blue',
                            weight: 3,
                            opacity: 0.7,
                            fillColor: 'cyan',
                            fillOpacity: 0.3,
                        })}
                    />
                ))}
            </MapContainer>

            <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
                <button onClick={handleCheckSpatialPlan}>Cek Tata Ruang</button>
                <button onClick={handleClearMap}>Hapus Polygon</button>
                <button onClick={handleRedraw}>Gambar Ulang</button>
            </div>

            <div style={{ overflowY: 'auto', flexGrow: 1, padding: '10px', background: '#f0f0f0' }}>
                <h3>Hasil Pengecekan Tata Ruang:</h3>
                {intersectionResults.length > 0 ? (
                    intersectionResults.map((result, index) => (
                        <div key={index} style={{ marginBottom: '15px', border: '1px solid #ccc', padding: '10px' }}>
                            <h4>Potongan Zonasi {index + 1}</h4>
                            <p><strong>Luas (m²):</strong> {result.intersected_area_sqm.toFixed(2)}</p>
                            <p><strong>Kode Zonasi:</strong> {result.zonasi_kode}</p>
                            <p><strong>Kecamatan:</strong> {result.zonasi_kec}</p>

                            {/* Display all relevant tabelpola_data */}
                            <h5>Informasi Detail (Tabel Pola):</h5>
                            {result.tabelpola_data && Object.keys(result.tabelpola_data).length > 0 ? (
                                <ul>
                                    {Object.entries(result.tabelpola_data).map(([key, value]) => (
                                        <li key={key}>
                                            <strong>{key.replace(/_/g, ' ')}:</strong> {typeof value === 'boolean' ? (value ? 'Ya' : 'Tidak') : value}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>Tidak ada informasi detail dari Tabel Pola.</p>
                            )}
                        </div>
                    ))
                ) : (
                    <p>Tidak ada hasil atau belum ada polygon digambar.</p>
                )}
            </div>
        </div>
    );
};

export default MapComponent;
