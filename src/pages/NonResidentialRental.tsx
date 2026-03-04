import { useState } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import MapFilterBar, { FilterState, DEFAULT_FILTERS } from "@/components/MapFilterBar";
import LandlordSearchModal from "@/components/LandlordSearchModal";
import { MapProperty } from "@/data/mapProperties";
import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";
import property4 from "@/assets/property4.jpg";
import property5 from "@/assets/property5.jpg";
import property6 from "@/assets/property6.jpg";

const NON_RESIDENTIAL_PROPERTIES: MapProperty[] = [
  {
    id: 401,
    title: "구로 디지털단지 대형 사무실",
    buildingName: "구로 IT밸리",
    address: "서울특별시 구로구 구로동 222-10",
    type: "사무실",
    roomType: "사무실",
    area: "198㎡ (60평)",
    floor: "5층",
    deposit: "5,000만원",
    monthly: "450만원",
    isNew: true,
    isHot: true,
    views: 3100,
    lat: 37.4853,
    lng: 126.8982,
    image: property1,
    description: "구로디지털단지역 도보 3분. 대형 사무실 임대. 회의실 2개 포함, 주차 가능.",
    contact: "02-1111-3333",
    agentName: "구로IT부동산",
    manageFee: "40만원",
    parking: "5대",
    elevator: true,
    availableFrom: "즉시",
    totalFloors: "지상 12층",
    buildYear: "2016년",
  },
  {
    id: 402,
    title: "인천 남동공단 공장 임대",
    buildingName: "남동산단 공장동",
    address: "인천광역시 남동구 고잔동 777",
    type: "공장·창고",
    roomType: "공장",
    area: "660㎡ (200평)",
    floor: "1층",
    deposit: "3,000만원",
    monthly: "350만원",
    isNew: false,
    isHot: false,
    views: 890,
    lat: 37.4123,
    lng: 126.7312,
    image: property2,
    description: "인천 남동공단 내 공장. 천장고 7m, 대형 셔터 2개. 물류/제조업 입주 가능.",
    contact: "032-2222-4444",
    agentName: "인천공업부동산",
    manageFee: "20만원",
    parking: "10대",
    elevator: false,
    availableFrom: "즉시",
    totalFloors: "1층",
    buildYear: "2005년",
  },
  {
    id: 403,
    title: "강동 성내동 병원·학원 임대",
    buildingName: "강동 메디컬빌딩",
    address: "서울특별시 강동구 성내동 100-3",
    type: "병원·학원",
    roomType: "병원",
    area: "132㎡ (40평)",
    floor: "2층",
    deposit: "8,000만원",
    monthly: "300만원",
    isNew: true,
    isHot: false,
    views: 1540,
    lat: 37.5308,
    lng: 127.1239,
    image: property3,
    description: "의료기관 전용 건물 내 임대. 내부 칸막이 시공 가능. 엘리베이터 완비.",
    contact: "02-3333-5555",
    agentName: "강동메디부동산",
    manageFee: "25만원",
    parking: "4대",
    elevator: true,
    availableFrom: "즉시",
    totalFloors: "지상 8층",
    buildYear: "2012년",
  },
  {
    id: 404,
    title: "의왕 포일동 물류창고",
    buildingName: "의왕 스마트물류센터",
    address: "경기도 의왕시 포일동 500",
    type: "공장·창고",
    roomType: "창고",
    area: "1,320㎡ (400평)",
    floor: "1층",
    deposit: "5,000만원",
    monthly: "600만원",
    isNew: false,
    isHot: true,
    views: 2200,
    lat: 37.3570,
    lng: 126.9680,
    image: property4,
    description: "의왕 내륙물류기지 인근 창고. 컨테이너 접안 가능, 냉동창고 구역 포함.",
    contact: "031-4444-6666",
    agentName: "경기물류부동산",
    manageFee: "50만원",
    parking: "20대",
    elevator: false,
    availableFrom: "협의",
    totalFloors: "1층",
    buildYear: "2008년",
  },
  {
    id: 405,
    title: "노원 중계동 학원 임대",
    buildingName: "중계학원가 빌딩",
    address: "서울특별시 노원구 중계동 399-1",
    type: "병원·학원",
    roomType: "학원",
    area: "198㎡ (60평)",
    floor: "3층",
    deposit: "5,000만원",
    monthly: "250만원",
    isNew: true,
    isHot: false,
    views: 3800,
    lat: 37.6441,
    lng: 127.0742,
    image: property5,
    description: "대치동 학원가 수준의 중계동 교육특구 내 학원 공실. 강의실 5개 분리 구성 가능.",
    contact: "02-5555-7777",
    agentName: "노원교육부동산",
    manageFee: "30만원",
    parking: "3대",
    elevator: true,
    availableFrom: "즉시",
    totalFloors: "지상 6층",
    buildYear: "2009년",
  },
  {
    id: 406,
    title: "마포 사무실 소호 오피스",
    buildingName: "마포 소호빌딩",
    address: "서울특별시 마포구 도화동 173",
    type: "사무실",
    roomType: "소형사무실",
    area: "33㎡ (10평)",
    floor: "6층",
    deposit: "1,000만원",
    monthly: "90만원",
    isNew: false,
    isHot: false,
    views: 670,
    lat: 37.5379,
    lng: 126.9501,
    image: property6,
    description: "마포역 인근 소형 사무실. 인터넷 전용 회선 포함, 공용 회의실 사용 가능.",
    contact: "02-6666-8888",
    agentName: "마포공인",
    manageFee: "8만원",
    parking: "없음",
    elevator: true,
    availableFrom: "즉시",
    totalFloors: "지상 10층",
    buildYear: "2014년",
  },
  {
    id: 411,
    title: "구로 IT밸리 사무실 매매",
    buildingName: "구로 IT밸리",
    address: "서울특별시 구로구 구로동 222-10",
    type: "사무실매매",
    roomType: "사무실",
    area: "165㎡ (50평)",
    floor: "7층",
    deposit: "18억원",
    monthly: "-",
    isNew: true,
    isHot: false,
    views: 980,
    lat: 37.4870,
    lng: 126.9010,
    image: property1,
    description: "구로디지털단지 내 사무실 구분 매매. 임대 수익형 투자 가능.",
    contact: "02-1111-9999",
    agentName: "구로IT부동산",
    manageFee: "40만원",
    parking: "3대",
    elevator: true,
    availableFrom: "협의",
    totalFloors: "지상 12층",
    buildYear: "2016년",
  },
  {
    id: 412,
    title: "인천 남동 공장 건물 매매",
    buildingName: "남동산단 A동",
    address: "인천광역시 남동구 고잔동 800",
    type: "공장·창고매매",
    roomType: "공장",
    area: "1,320㎡ (400평)",
    floor: "1층",
    deposit: "30억원",
    monthly: "-",
    isNew: false,
    isHot: true,
    views: 1500,
    lat: 37.4140,
    lng: 126.7350,
    image: property2,
    description: "남동공단 대형 공장 건물 매매. 토지 포함, 물류/제조 사업자에 적합.",
    contact: "032-2222-8888",
    agentName: "인천공업부동산",
    manageFee: "-",
    parking: "15대",
    elevator: false,
    availableFrom: "협의",
    totalFloors: "2층",
    buildYear: "2003년",
  },
];

const NON_RESIDENTIAL_SUBTYPES = [
  { label: "전체", group: "전체", key: "전체" },
  { label: "사무실", group: "임대", key: "임대-사무실" },
  { label: "공장·창고", group: "임대", key: "임대-공장·창고" },
  { label: "병원·학원", group: "임대", key: "임대-병원·학원" },
  { label: "기타임대", group: "임대", key: "임대-기타임대" },
  { label: "사무실", group: "매매", key: "매매-사무실" },
  { label: "다가구", group: "매매", key: "매매-다가구" },
  { label: "공장·창고", group: "매매", key: "매매-공장·창고" },
  { label: "상가건물", group: "매매", key: "매매-상가건물" },
  { label: "창고/공장", group: "매매", key: "매매-창고/공장" },
];

const NonResidentialRental = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTypes, setActiveTypes] = useState<string[]>(["전체"]);
  const [query, setQuery] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [showLandlord, setShowLandlord] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const toggleType = (k: string) => {
    if (k === "전체") {
      setActiveTypes(["전체"]);
      return;
    }
    setActiveTypes(prev => {
      const without전체 = prev.filter(x => x !== "전체");
      if (without전체.includes(k)) {
        const next = without전체.filter(x => x !== k);
        return next.length === 0 ? ["전체"] : next;
      }
      return [...without전체, k];
    });
  };

  const filtered = NON_RESIDENTIAL_PROPERTIES.filter(p => {
    if (!activeTypes.includes("전체")) {
      // 선택된 key들에 해당하는 type 목록 추출
      const selectedTypes = NON_RESIDENTIAL_SUBTYPES
        .filter(s => activeTypes.includes(s.key))
        .map(s => s.label);
      if (!selectedTypes.includes(p.type)) return false;
    }
    if (propertyId && !String(p.id).includes(propertyId)) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!p.address.toLowerCase().includes(q) && !p.title.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const activeType = activeTypes[0] ?? "전체";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {showLandlord && <LandlordSearchModal onClose={() => setShowLandlord(false)} />}

      {/* 유형 탭 - 다중 선택 */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto"
        style={{ background: "hsl(var(--header-bg))" }}
      >
        {/* 임대 그룹 */}
        <span className="text-white/40 text-[10px] font-semibold whitespace-nowrap">임대</span>
        {NON_RESIDENTIAL_SUBTYPES.filter(t => t.group === "전체" || t.group === "임대").map(t => {
          const isActive = activeTypes.includes(t.label);
          return (
            <button
              key={t.label}
              onClick={() => toggleType(t.label)}
              className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all flex-shrink-0"
              style={
                isActive
                  ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }
                  : { background: "transparent", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }
              }
            >
              {t.label}
            </button>
          );
        })}

        <div className="w-px h-4 mx-1 flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }} />

        {/* 매매 그룹 */}
        <span className="text-white/40 text-[10px] font-semibold whitespace-nowrap">매매</span>
        {NON_RESIDENTIAL_SUBTYPES.filter(t => t.group === "매매").map((t, i) => {
          const key = `매매-${t.label}-${i}`;
          const isActive = activeTypes.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggleType(key)}
              className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all flex-shrink-0"
              style={
                isActive
                  ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }
                  : { background: "transparent", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <main
        className="flex-1 flex flex-col md:flex-row overflow-hidden"
        style={{ height: "calc(100vh - 56px - 41px)" }}
      >
        <MapSidebar
          properties={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          activeType={activeType}
          onTypeChange={(t) => toggleType(t)}
        />
        <div className="flex-1 relative">
          <MapView
            properties={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <MapFilterBar
            activeType={activeType}
            onTypeChange={(t) => toggleType(t)}
            query={query}
            onQueryChange={setQuery}
            propertyId={propertyId}
            onPropertyIdChange={setPropertyId}
            filters={filters}
            onFiltersChange={setFilters}
            onLandlordClick={() => setShowLandlord(true)}
            nonResidentialSubtypes={NON_RESIDENTIAL_SUBTYPES}
            showRoomTypes={false}
          />
        </div>
      </main>
    </div>
  );
};

export default NonResidentialRental;
