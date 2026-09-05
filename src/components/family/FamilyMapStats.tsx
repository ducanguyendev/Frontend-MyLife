import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface CityLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
  percentage: number;
  description: string;
}

const cityData: CityLocation[] = [
  { id: '1', name: 'TP. Hồ Chí Minh', lat: 10.8231, lng: 106.6297, count: 42, percentage: 45, description: 'Nơi tập trung đông con cháu lập nghiệp nhất.' },
  { id: '2', name: 'Hà Nội', lat: 21.0285, lng: 105.8542, count: 28, percentage: 30, description: 'Khu vực thủ đô và các tỉnh lân cận.' },
  { id: '3', name: 'Nam Định (Quê gốc)', lat: 20.4300, lng: 106.1688, count: 15, percentage: 16, description: 'Nơi đặt nhà thờ tổ và từ đường dòng họ.' },
  { id: '4', name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022, count: 8, percentage: 9, description: 'Chi nhánh miền Trung.' },
];

// Component con phụ trách việc di chuyển camera bản đồ
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  map.flyTo(center, zoom, {
    duration: 1.5 // Thời gian hiệu ứng bay mượt mà (giây)
  });
  return null;
};

export const FamilyMapStats: React.FC = () => {
  // Mặc định tâm bản đồ ban đầu ở Việt Nam
  const [mapCenter, setMapCenter] = useState<[number, number]>([16.047079, 108.206230]);
  const [mapZoom, setMapZoom] = useState<number>(6);
  const [activeCityId, setActiveCityId] = useState<string | null>(null);

  const handleSelectCity = (city: CityLocation) => {
    setMapCenter([city.lat, city.lng]);
    setMapZoom(11); // Phóng to khi chọn thành phố cụ thể
    setActiveCityId(city.id);
  };

  return (
    <div className="space-y-6">
      <div className="bg-secondary-bg border border-white/10 rounded-2xl p-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold">Bản Đồ Phân Bố Con Cháu Dòng Họ</h3>
          <p className="text-xs text-gray-400 mt-0.5">Click vào các thẻ tỉnh thành bên dưới để bản đồ tự động di chuyển đến vị trí tương ứng.</p>
        </div>

        {/* Khung bản đồ tương tác trực quan */}
        <div className="h-96 w-full rounded-2xl overflow-hidden border border-white/10 relative z-0">
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            scrollWheelZoom={false} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapCenter} zoom={mapZoom} />

            {cityData.map((city) => (
              <Marker key={city.id} position={[city.lat, city.lng]}>
                <Popup>
                  <div className="text-primary-text space-y-1">
                    <strong className="text-sm font-bold text-accent">{city.name}</strong>
                    <p className="text-xs text-gray-600">Số lượng: {city.count} thành viên</p>
                    <p className="text-xs text-gray-500 italic">{city.description}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Danh sách thẻ tỉnh thành khi click sẽ điều khiển bản đồ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {cityData.map((r) => (
            <div 
              key={r.id} 
              onClick={() => handleSelectCity(r)}
              className={`space-y-1.5 p-4 rounded-xl border transition cursor-pointer ${
                activeCityId === r.id ? 'bg-accent/10 border-accent shadow-lg shadow-accent/10' : 'bg-primary-bg/50 border-white/5 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-primary-text flex items-center gap-2">
                  <MapPin className={`w-4 h-4 ${activeCityId === r.id ? 'text-accent' : 'text-emerald-400'}`} /> 
                  {r.name}
                </span>
                <span className="font-bold text-accent">{r.count} thành viên ({r.percentage}%)</span>
              </div>
              <div className="w-full bg-secondary-bg h-2.5 rounded-full overflow-hidden">
                <div className="bg-accent h-full rounded-full transition-all duration-500" style={{ width: `${r.percentage}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};