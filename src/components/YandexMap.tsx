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

const API_KEY = process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY ?? '';
const IS_KEY_SET =
  API_KEY.length > 0 && API_KEY !== 'YOUR_YANDEX_MAPS_API_KEY';

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

// Набор дефолтных разрешённых имён Placemark. Цвет задаётся через iconColor.
function buildHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
  html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; }
</style>
<script src="https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${API_KEY}"></script>
</head>
<body>
<div id="map"></div>
<script>
(function () {
  var map = null;
  var fitDone = false;

  function post(type, data) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
    }
  }

  window.setMarkers = function (rooms, userLocation) {
    if (!map) return;
    map.geoObjects.removeAll();

    if (userLocation && typeof userLocation.latitude === 'number') {
      var circle = new ymaps.Circle(
        [[userLocation.latitude, userLocation.longitude], 120],
        {},
        { strokeColor: '#20E3C266', strokeWidth: 2, fillColor: '#20E3C233' }
      );
      var dot = new ymaps.Placemark(
        [userLocation.latitude, userLocation.longitude],
        {},
        { preset: 'islands#blueCircleDotIcon' }
      );
      map.geoObjects.add(circle);
      map.geoObjects.add(dot);
    }

    (rooms || []).forEach(function (room) {
      var marker = new ymaps.Placemark(
        [room.latitude, room.longitude],
        { hintContent: room.name },
        { preset: 'islands#circleIcon', iconColor: '#20E3C2' }
      );
      marker.events.add('click', function () {
        post('roomPress', { roomId: room.id });
      });
      map.geoObjects.add(marker);
    });
    if (!fitDone && map.geoObjects.getBounds && rooms.length > 0) {
      fitDone = true;
      fitBounds(rooms);
    }
  };

  function fitBounds(rooms) {
    if (!map) return;
    if (rooms.length === 1) {
      map.setCenter([rooms[0].latitude, rooms[0].longitude], 13);
      return;
    }
    var minLat = Infinity, maxLat = -Infinity;
    var minLng = Infinity, maxLng = -Infinity;
    (rooms || []).forEach(function (r) {
      if (r.latitude < minLat) minLat = r.latitude;
      if (r.latitude > maxLat) maxLat = r.latitude;
      if (r.longitude < minLng) minLng = r.longitude;
      if (r.longitude > maxLng) maxLng = r.longitude;
    });
    // Квесты разбросаны по нескольким городам — не приближаемся к стране целиком,
    // а показываем Москву как дефолтный стартовый вид.
    if (maxLat - minLat + maxLng - minLng > 20) {
      map.setCenter([55.7558, 37.6173], 10);
      return;
    }
    var bounds = map.geoObjects.getBounds();
    if (bounds) {
      map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 });
    }
  }

  window.setCenter = function (lat, lng, zoom) {
    if (!map) return;
    if (map.geoObjects.getLength() > 0 && lat > 0) {
      map.setCenter([lat, lng], zoom || 10, { duration: 500 });
    }
  };

  window.initMap = function () {
    map = new ymaps.Map(document.getElementById('map'), {
      center: [55.7558, 37.6173],
      zoom: 10,
      controls: ['zoomControl', 'geolocationControl', 'fullscreenControl'],
    });
    map.events.add('click', function () {
      map.balloon.close();
    });

    // После построения сетки карты корректируем размер, чтобы карта
    // корректно отрисовалась внутри WebView.
    map.events.once('boundschange', function () {
      setTimeout(function () {
        try { map.container.fitToViewport(); } catch (e) { /* noop */ }
      }, 250);
    });

    post('ready', null);
  };

  ymaps.ready(function () {
    window.initMap();
  });
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
      {IS_KEY_SET && !loadFailed ? (
        <WebView
          ref={webViewRef}
          source={{ html: buildHtml(), baseUrl: 'https://api-maps.yandex.ru' }}
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
          <Text style={styles.noKeyTitle}>
            {loadFailed ? 'Не удалось загрузить карту' : 'Карта недоступна'}
          </Text>
          <Text style={styles.noKeyText}>
            {loadFailed
              ? 'Похоже, ключ не подходит для отрисовки карт. Создайте в консоли Яндекса новый ключ и включите сервис «Maps JS API», затем обновите EXPO_PUBLIC_YANDEX_MAPS_API_KEY в .env и перезапустите expo start.'
              : `Укажите ключ Яндекс Карт в файле .env:{'\n'}EXPO_PUBLIC_YANDEX_MAPS_API_KEY=ваш_ключ{'\n\n'}Ключ бесплатно выдаётся на developer.tech.yandex.ru.`}
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