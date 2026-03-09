import { useState, useMemo } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import MapFilterBar, { FilterState, DEFAULT_FILTERS } from "@/components/MapFilterBar";
import LandlordSearchModal from "@/components/LandlordSearchModal";
import { useDBProperties } from "@/hooks/useDBProperties";
import { MapProperty } from "@/data/mapProperties";
import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";
import property4 from "@/assets/property4.jpg";
import property5 from "@/assets/property5.jpg";
import property6 from "@/assets/property6.jpg";

const APARTMENT_PROPERTIES: MapProperty[] = [
  {
    id: 501,
    title: "강남 도곡동 아파트 전세",
    buildingName: "도곡 렉슬아파트",
    address: "서울특별시 강남구 도곡동 467",
    type: "아파트",
    roomType: "아파트",
    area: "84㎡ (25평)",
    floor: "10층",
    deposit: "8억원",
    monthly: "-",
    isNew: true,
    isHot: true,
    views: 3200,
    lat: 37.4890,
    lng: 127.0454,
    image: property1,
    description: "도곡렉슬 84㎡ 전세. 남향, 리모델링 완료. 즉시 입주 가능.",
    buildingMemo: "단지 내 학교, 마트, 경비 24시간",
    roomMemo: "10층 남향, 풀리모델링, 주방 빌트인",
    registeredDate: "2026-02-10",
    checkedDate: "2026-03-01",
    buildingPassword: "1234#",
    roomPassword: "5678*",
    options: ["에어컨", "냉장고", "세탁기", "건조기", "전자키", "주차"],
    contactOwner: "010-1111-2222",
    contactManager: "010-3333-4444",
    contact: "02-1111-2222",
    agentName: "도곡공인중개",
    manageFee: "20만원",
    parking: "2대",
    elevator: true,
    availableFrom: "즉시",
    totalFloors: "지상 25층",
    buildYear: "2002년",
  },
  {
    id: 502,
    title: "잠실 엘스 오피스텔",
    buildingName: "잠실 엘스오피스텔",
    address: "서울특별시 송파구 잠실동 1-1",
    type: "오피스텔",
    roomType: "오피스텔",
    area: "33㎡ (10평)",
    floor: "20층",
    deposit: "3,000만원",
    monthly: "130만원",
    isNew: true,
    isHot: false,
    views: 1450,
    lat: 37.5131,
    lng: 127.1003,
    image: property2,
    description: "잠실역 초역세권 오피스텔. 한강뷰, 풀옵션. 관리비 포함.",
    buildingMemo: "헬스장, 사우나, 컨시어지 서비스",
    roomMemo: "20층 한강뷰, 풀옵션, 신혼부부 선호",
    registeredDate: "2026-02-15",
    checkedDate: "2026-03-02",
    buildingPassword: "2345#",
    roomPassword: "6789*",
    options: ["에어컨", "냉장고", "세탁기", "TV", "침대", "전자키", "주차"],
    contactOwner: "010-2222-3333",
    contact: "02-2222-3333",
    agentName: "잠실공인",
    manageFee: "15만원",
    parking: "1대",
    elevator: true,
    availableFrom: "즉시",
    totalFloors: "지상 35층",
    buildYear: "2020년",
  },
  {
    id: 503,
    title: "마포 래미안 아파트 월세",
    buildingName: "마포 래미안 푸르지오",
    address: "서울특별시 마포구 아현동 236",
    type: "아파트",
    roomType: "아파트",
    area: "59㎡ (18평)",
    floor: "6층",
    deposit: "5,000만원",
    monthly: "150만원",
    isNew: false,
    isHot: true,
    views: 2100,
    lat: 37.5503,
    lng: 126.9538,
    image: property3,
    description: "마포래미안 59㎡ 월세. 깔끔한 상태, 역세권. 관리비 별도.",
    buildingMemo: "단지 내 어린이집, 주차 넉넉",
    roomMemo: "6층 동향, 상태 양호, 세탁기 신형",
    registeredDate: "2026-02-20",
    checkedDate: "2026-03-03",
    buildingPassword: "3456#",
    roomPassword: "0001*",
    options: ["에어컨", "냉장고", "세탁기", "전자키", "주차"],
    contactOwner: "010-3333-4444",
    contact: "02-3333-4444",
    agentName: "아현공인중개",
    manageFee: "12만원",
    parking: "1대",
    elevator: true,
    availableFrom: "2026-04-01",
    totalFloors: "지상 20층",
    buildYear: "2014년",
  },
  {
    id: 504,
    title: "여의도 파크원 오피스텔",
    buildingName: "여의도 파크원타워",
    address: "서울특별시 영등포구 여의도동 60",
    type: "오피스텔",
    roomType: "오피스텔",
    area: "45㎡ (14평)",
    floor: "18층",
    deposit: "5,000만원",
    monthly: "200만원",
    isNew: false,
    isHot: false,
    views: 870,
    lat: 37.5261,
    lng: 126.9265,
    image: property4,
    description: "파크원 타워 오피스텔. 한강뷰, 고층. 관리비 포함 가격.",
    buildingMemo: "콘시어지, 피트니스센터, 수영장",
    roomMemo: "18층 한강뷰, 풀옵션 완비",
    registeredDate: "2026-02-25",
    checkedDate: "2026-03-04",
    buildingPassword: "4567#",
    roomPassword: "1234*",
    options: ["에어컨", "냉장고", "세탁기", "TV", "침대", "책상", "전자키", "주차"],
    contactOwner: "010-4444-5555",
    contact: "02-4444-5555",
    agentName: "여의도부동산",
    manageFee: "포함",
    parking: "1대",
    elevator: true,
    availableFrom: "즉시",
    totalFloors: "지상 56층",
    buildYear: "2020년",
  },
  {
    id: 505,
    title: "성수 트리마제 아파트",
    buildingName: "성수 트리마제",
    address: "서울특별시 성동구 성수동2가 278",
    type: "아파트",
    roomType: "아파트",
    area: "101㎡ (30평)",
    floor: "15층",
    deposit: "15억원",
    monthly: "-",
    isNew: true,
    isHot: true,
    views: 5100,
    lat: 37.5451,
    lng: 127.0617,
    image: property5,
    description: "성수 트리마제 30평 전세. 한강뷰, 고층 탁 트인 조망. 고급 인테리어.",
    buildingMemo: "한강뷰 단지, 수영장·피트니스 완비, 경비 24시간",
    roomMemo: "15층 한강뷰, 고급 빌트인, 드레스룸",
    registeredDate: "2026-03-01",
    checkedDate: "2026-03-05",
    buildingPassword: "5678#",
    roomPassword: "9012*",
    options: ["에어컨", "냉장고", "세탁기", "건조기", "TV", "전자키", "주차"],
    contactOwner: "010-5555-6666",
    contactManager: "010-7777-8888",
    contact: "02-5555-6666",
    agentName: "성수공인중개",
    manageFee: "25만원",
    parking: "2대",
    elevator: true,
    availableFrom: "즉시",
    totalFloors: "지상 40층",
    buildYear: "2017년",
  },
  {
    id: 506,
    title: "판교 알파돔 오피스텔",
    buildingName: "판교 알파돔시티",
    address: "경기도 성남시 분당구 삼평동 670",
    type: "오피스텔",
    roomType: "오피스텔",
    area: "40㎡ (12평)",
    floor: "8층",
    deposit: "2,000만원",
    monthly: "110만원",
    isNew: false,
    isHot: false,
    views: 620,
    lat: 37.3952,
    lng: 127.1107,
    image: property6,
    description: "판교역 초역세권 오피스텔. IT기업 밀집 지역, 풀옵션.",
    buildingMemo: "역세권, 대형마트·카페 연결, 주차 넉넉",
    roomMemo: "8층, 풀옵션, 채광 좋음",
    registeredDate: "2026-02-18",
    checkedDate: "2026-03-02",
    buildingPassword: "6789#",
    roomPassword: "3456*",
    options: ["에어컨", "냉장고", "세탁기", "TV", "전자키", "주차"],
    contactOwner: "010-6666-7777",
    contact: "031-6666-7777",
    agentName: "판교공인",
    manageFee: "8만원",
    parking: "1대",
    elevator: true,
    availableFrom: "즉시",
    totalFloors: "지상 15층",
    buildYear: "2016년",
  },
];

const APARTMENT_SUBTYPES = ["아파트", "아파트분양권", "오피스텔", "오피스텔분양권", "연립/다세대", "빌라분양권"];
const APARTMENT_DEAL_TYPES = ["매매+전세+월세", "매매", "전세+월세", "전세", "월세"];

const APARTMENT_DB_TYPES = ["아파트", "오피스텔"];

const ApartmentRental = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeDealTypes, setActiveDealTypes] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [showLandlord, setShowLandlord] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // DB 매물 (아파트/오피스텔)
  const { properties: dbProperties } = useDBProperties(APARTMENT_DB_TYPES);

  // static + DB 합치기
  const allProperties = useMemo(
    () => [...APARTMENT_PROPERTIES, ...dbProperties],
    [dbProperties]
  );

  const toggleType = (t: string) => {
    setActiveTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const toggleDealType = (t: string) => {
    setActiveDealTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const filtered = allProperties.filter(p => {
    if (activeTypes.length > 0 && !activeTypes.includes(p.type)) return false;
    if (propertyId && !String(p.id).includes(propertyId)) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!p.address.toLowerCase().includes(q) && !p.title.toLowerCase().includes(q) && !(p.buildingName ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const activeType = activeTypes[0] ?? "전체";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {showLandlord && <LandlordSearchModal onClose={() => setShowLandlord(false)} />}

      <div
        className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto"
        style={{ background: "hsl(var(--header-bg))" }}
      >
        {/* 종류 */}
        <span className="text-white/40 text-[10px] font-semibold whitespace-nowrap flex-shrink-0">종 류</span>
        {APARTMENT_SUBTYPES.map(t => {
          const isActive = activeTypes.includes(t);
          return (
            <button key={t} onClick={() => toggleType(t)}
              className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all flex-shrink-0"
              style={isActive ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" } : { background: "transparent", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }}
            >{t}</button>
          );
        })}
        {activeTypes.length > 0 && (
          <button onClick={() => setActiveTypes([])}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold border whitespace-nowrap flex-shrink-0 transition-all"
            style={{ color: "hsl(var(--destructive))", borderColor: "hsl(var(--destructive))", background: "transparent" }}
          >선택 삭제</button>
        )}

        <div className="w-px h-4 mx-1 flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }} />

        {/* 매전월 */}
        <span className="text-white/40 text-[10px] font-semibold whitespace-nowrap flex-shrink-0">매전월</span>
        {APARTMENT_DEAL_TYPES.map(t => {
          const isActive = activeDealTypes.includes(t);
          return (
            <button key={t} onClick={() => toggleDealType(t)}
              className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all flex-shrink-0"
              style={isActive ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" } : { background: "transparent", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }}
            >{t}</button>
          );
        })}
        {activeDealTypes.length > 0 && (
          <button onClick={() => setActiveDealTypes([])}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold border whitespace-nowrap flex-shrink-0 transition-all"
            style={{ color: "hsl(var(--destructive))", borderColor: "hsl(var(--destructive))", background: "transparent" }}
          >선택 삭제</button>
        )}
      </div>

      <main
        className="flex-1 overflow-hidden flex relative"
        style={{ height: "calc(100vh - 56px - 41px)" }}
      >
        <MapSidebar
          properties={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          activeType={activeType}
          onTypeChange={(t) => toggleType(t)}
        />
        <div className="flex-1 relative min-w-0">
          <MapView
            properties={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <MapFilterBar
            activeType={activeType}
            activeTypes={activeTypes}
            onTypeChange={(t) => toggleType(t)}
            query={query}
            onQueryChange={setQuery}
            propertyId={propertyId}
            onPropertyIdChange={setPropertyId}
            filters={filters}
            onFiltersChange={setFilters}
            onLandlordClick={() => setShowLandlord(true)}
            showCategoryChips={false}
            showRoomTypes={false}
            showApartmentFilters={true}
            apartmentActiveTypes={activeTypes}
            onApartmentTypeChange={toggleType}
            onClearApartmentTypes={() => setActiveTypes([])}
            apartmentDealTypes={activeDealTypes}
            onApartmentDealTypeChange={toggleDealType}
            onClearApartmentDealTypes={() => setActiveDealTypes([])}
          />
        </div>
      </main>
    </div>
  );
};

export default ApartmentRental;
