import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { QuestRoom } from '../types';

// Дефолтный центр карты (Москва).
const DEFAULT_CENTER: [number, number] = [55.7558, 37.6173];
const DEFAULT_ZOOM = 10;

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface YandexMapProps {
  rooms: QuestRoom[];
  center?: Coordinate;
  zoom?: number;
  userLocation?: Coordinate | null;
  onPressRoom?: (roomId: string) => void;
  style?: StyleProp<ViewStyle>;
}

// Карта на OpenStreetMap (Leaflet). Работает без ключей и API-регистрации,
// живёт внутри WebView и не тянет тяжёлый JS-бандл Яндекс.Карт.
function buildHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #11161D; }
  /* Тёмная тема тайлов OSM */
  .leaflet-tile { filter: brightness(0.68) invert(1) hue-rotate(180deg) saturate(0.55) contrast(0.95); }
  .room-marker { background: #20E3C2; border: 3px solid #fff; border-radius: 50%; width: 18px; height: 18px; box-shadow: 0 2px 6px rgba(0,0,0,.45); }
  .user-dot { background: #3D7BFF; border: 3px solid #fff; border-radius: 50%; width: 16px; height: 16px; box-shadow: 0 2px 6px rgba(0,0,0,.45); }
  .leaflet-tooltip { background: #1b2430; border: 1px solid #2b3648; color: #E6EDF5; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.5); }
  .leaflet-tooltip-top:before { border-top-color: #1b2430; }
  .leaflet-bar a { background: #1b2430; color: #E6EDF5; border-color: #2b3648; }
  .leaflet-bar a:hover { background: #243142; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  var map = null;
  var layerGroup = null;
  var fitDone = false;

  function post(type, data) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
    }
  }

  function fitBounds(rooms) {
    if (!map || !rooms.length) return;
    if (rooms.length === 1) {
      map.setView([rooms[0].latitude, rooms[0].longitude], 13);
      return;
    }
    var minLat = Infinity, maxLat = -Infinity;
    var minLng = Infinity, maxLng = -Infinity;
    rooms.forEach(function (r) {
      if (r.latitude < minLat) minLat = r.latitude;
      if (r.latitude > maxLat) maxLat = r.latitude;
      if (r.longitude < minLng) minLng = r.longitude;
      if (r.longitude > maxLng) maxLng = r.longitude;
    });
    // Квесты разбросаны по нескольким городам — показываем стартовый вид.
    if (maxLat - minLat + maxLng - minLng > 20) {
      map.setView([55.7558, 37.6173], 10);
      return;
    }
    map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [32, 32], maxZoom: 14 });
  }

  window.setMarkers = function (rooms, userLocation) {
    if (!map) return;
    if (layerGroup) layerGroup.remove();
    layerGroup = L.layerGroup().addTo(map);

    if (userLocation && typeof userLocation.latitude === 'number') {
      L.circle([userLocation.latitude, userLocation.longitude], {
        radius: 120,
        color: '#3D7BFF',
        weight: 1,
        fillColor: '#3D7BFF',
        fillOpacity: 0.18,
      }).addTo(layerGroup);
      L.marker([userLocation.latitude, userLocation.longitude], {
        icon: L.divIcon({ className: '', iconSize: [16, 16], iconAnchor: [8, 8], html: '<div class="user-dot"></div>' }),
      }).addTo(layerGroup);
    }

    (rooms || []).forEach(function (room) {
      var marker = L.marker([room.latitude, room.longitude], {
        icon: L.divIcon({ className: '', iconSize: [18, 18], iconAnchor: [9, 9], html: '<div class="room-marker"></div>' }),
      });
      marker.bindTooltip(room.name, { direction: 'top', offset: [0, -12] });
      marker.on('click', function () {
        post('roomPress', { roomId: room.id });
      });
      marker.addTo(layerGroup);
    });

    if (rooms.length && !fitDone) {
      fitDone = true;
      setTimeout(function () { fitBounds(rooms); }, 60);
    }
  };

  window.setCenter = function (lat, lng, zoom) {
    if (!map) return;
    map.flyTo([lat, lng], zoom || 10, { duration: 0.6 });
  };

  window.initMap = function () {
    map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
    }).setView([55.7558, 37.6173], 10);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      tileSize: 256,
      subdomains: 'abc',
    }).addTo(map);

    post('ready', null);
  };

  window.initMap();
})();
</script>
</body>
</html>`;
}

export default function YandexMap({
  rooms,
  center,
  zoom,
  userLocation,
  onPressRoom,
  style,
}: YandexMapProps) {
  const webViewRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const centerRef = useRef(center);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  // Сообщения из карты (готовность, клики по маркерам).
  function handleMessage(event: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ready') {
        readyRef.current = true;
        setReady(true);
      } else if (msg.type === 'roomPress') {
        onPressRoom?.(msg.data.roomId);
      }
    } catch (e) {
      // Игнорируем не JSON-сообщения
    }
  }

  // Отрисовка маркеров при загрузке карты или изменении данных.
  useEffect(() => {
    if (!readyRef.current) return;
    webViewRef.current?.injectJavaScript(
      `window.setMarkers(${JSON.stringify(rooms)}, ${JSON.stringify(
        userLocation ?? null
      )}); true;`
    );
  }, [ready, rooms, userLocation]);

  // Перенос центра по изменению пропа center (например, «перелететь» к геопозиции).
  useEffect(() => {
    if (!readyRef.current || !center) return;
    if (
      centerRef.current &&
      Math.abs(centerRef.current.latitude - center.latitude) < 0.0001 &&
      Math.abs(centerRef.current.longitude - center.longitude) < 0.0001
    ) {
      centerRef.current = center;
      return;
    }
    centerRef.current = center;
    webViewRef.current?.injectJavaScript(
      `window.setCenter(${center.latitude}, ${center.longitude}, ${zoom ?? DEFAULT_ZOOM}); true;`
    );
  }, [center, zoom]);

  return (
    <View style={[styles.container, style]}>
      {!loadFailed ? (
        <WebView
          ref={webViewRef}
          source={{ html: buildHtml(), baseUrl: 'https://unpkg.com' }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          onMessage={handleMessage}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 400) setLoadFailed(true);
          }}
          onError={() => setLoadFailed(true)}
          originWhitelist={['*']}
          setSupportMultipleWindows={false}
          geolocationEnabled
        />
      ) : (
        <View style={styles.noKey}>
          <Text style={styles.noKeyTitle}>Не удалось загрузить карту</Text>
          <Text style={styles.noKeyText}>
            Проверьте подключение к интернету: карта использует открытые тайлы
            OpenStreetMap и листовые стили Leaflet.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: '#11161D' },
  noKey: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0B0F14',
  },
  noKeyTitle: { fontSize: 18, fontWeight: '700', color: '#E6EDF5' },
  noKeyText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: '#A5B1BF',
    textAlign: 'center',
  },
});