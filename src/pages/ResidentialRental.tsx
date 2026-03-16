import { useState, useMemo } from "react";
import { useDBProperties } from "@/hooks/useDBProperties";
import { usePropertyFilter } from "@/hooks/usePropertyFilter";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import MapFilterBar, { FilterState, DEFAULT_FILTERS } from "@/components/MapFilterBar";
import LandlordSearchModal from "@/components/LandlordSearchModal";
import PropertyDetailPanel from "@/components/PropertyDetailPanel";
import { MapProperty } from "@/data/mapProperties";
import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";
import property4 from "@/assets/property4.jpg";
import property5 from "@/assets/property5.jpg";
import property6 from "@/assets/property6.jpg";

const RESIDENTIAL_PROPERTIES: MapProperty[] = [
  {
    id: 301,
    title: "강남 역삼동 신축 원룸",
    buildingName: "역삼 신축빌라",
    address: "서울특별시 강남구 역삼동 801-5",
    type: "원룸",
    roomType: "원룸",
    area: "20㎡ (6평)",
    floor: "3층",
    deposit: "1,000만원",
    monthly: "75만원",
    isNew: true,
    isHot: true,
    views: 2341,
    lat: 37.4985,
    lng: 127.0315,
    image: property1,
    description: "역삼역 도보 5분. 신축 원룸, 풀옵션. 에어컨, 세탁기, 냉장고, 전자레인지 포함.",
    buildingMemo: "건물주 직거래 가능, 1층 편의점 있음",
    roomMemo: "에어컨 신형, 남향, 채광 좋음",
    registeredDate: "2024-01-05",
    checkedDate: "2024-01-20",
    buildingPassword: "1234#",
    roomPassword: "5678*",
    options: ["에어컨", "세탁기", "냉장고", "전자레인지", "전자키"],
    contactOwner: "010-1111-2222",
    contactManager: "010-3333-4444",
    contact: "02-1111-2222",
    agentName: "역삼부동산",
    manageFee: "5만원",
    parking: "없음",
    elevator: true,
    availableFrom: "즉시",
    totalFloors: "지상 5층",
    buildYear: "2022년",
  },
  {
    id: 302,
    title: "마포 합정 투룸 전세",
    buildingName: "합정역세권 오피스텔",
    address: "서울특별시 마포구 합정동 402",
    type: "투룸",
    roomType: "투룸",
    area: "49㎡ (15평)",
    floor: "7층",
    deposit: "1억 2,000만원",
    monthly: "-",
    isNew: true,
    isHot: false,
    views: 1820,
    lat: 37.5495,
    lng: 126.9119,
    image: property2,
    description: "합정역 도보 3분 전세 투룸. 깨끗한 상태, 주차 1대 가능.",
    buildingMemo: "엘리베이터 최근 교체, 외벽 도색 완료",
    roomMemo: "7층 남향, 뷰 좋음, 세탁기 신형",
    registeredDate: "2024-01-08",
    checkedDate: "2024-01-22",
    buildingPassword: "2345#",
    roomPassword: "6789*",
    options: ["에어컨", "세탁기", "냉장고", "전자키", "주차"],
    contactOwner: "010-2222-3333",
    contactManager: "010-4444-5555",
    contact: "02-2222-3333",
    agentName: "합정공인중개",
    manageFee: "8만원",
    parking: "1대",
    elevator: true,
    availableFrom: "즉시",
    totalFloors: "지상 10층",
    buildYear: "2018년",
  },
  {
    id: 303,
    title: "성수동 쓰리룸 아파트",
    buildingName: "성수 자이아파트",
    address: "서울특별시 성동구 성수동1가 685",
    type: "쓰리룸+",
    roomType: "쓰리룸",
    area: "84㎡ (25평)",
    floor: "12층",
    deposit: "5,000만원",
    monthly: "220만원",
    isNew: false,
    isHot: true,
    views: 4300,
    lat: 37.5437,
    lng: 127.0542,
    image: property3,
    description: "성수역 도보 7분. 아파트 쓰리룸, 한강뷰. 리모델링 완료, 즉시 입주 가능.",
    buildingMemo: "경비원 24시간, 주차 넉넉, 단지 내 마트 있음",
    roomMemo: "한강뷰 확보, 풀리모델링, 빌트인 주방",
    registeredDate: "2024-01-12",
    checkedDate: "2024-01-28",
    buildingPassword: "3456*",
    roomPassword: "0001#",
    options: ["에어컨", "냉장고", "세탁기", "건조기", "TV", "전자키", "주차"],
    contactOwner: "010-3333-4444",
    contactManager: "010-5555-6666",
    contact: "02-3333-4444",
    agentName: "성수공인",
    manageFee: "15만원",
    parking: "2대",
    elevator: true,
    availableFrom: "즉시",
    totalFloors: "지상 22층",
    buildYear: "2015년",
  },
  {
    id: 304,
    title: "여의도 오피스텔 풀옵션",
    buildingName: "여의도 더클래식",
    address: "서울특별시 영등포구 여의도동 14",
    type: "오피스텔",
    roomType: "오피스텔",
    area: "33㎡ (10평)",
    floor: "15층",
    deposit: "3,000만원",
    monthly: "130만원",
    isNew: false,
    isHot: false,
    views: 980,
    lat: 37.5258,
    lng: 126.9223,
    image: property4,
    description: "여의도역 초역세권 오피스텔. 풀옵션, 한강뷰. 관리비 별도.",
    buildingMemo: "콘시어지 서비스, 헬스장·사우나 포함",
    roomMemo: "한강 직접 뷰, 풀옵션, 빌트인 가전 전부",
    registeredDate: "2024-01-15",
    checkedDate: "2024-02-01",
    buildingPassword: "4567#",
    roomPassword: "1234*",
    options: ["에어컨", "냉장고", "세탁기", "TV", "침대", "책상", "전자키", "주차"],
    contactOwner: "010-4444-5555",
    contact: "02-4444-5555",
    agentName: "여의도부동산",
    manageFee: "12만원",
    parking: "1대",
    elevator: true,
    availableFrom: "2024-03-01",
    totalFloors: "지상 30층",
    buildYear: "2019년",
  },
  {
    id: 305,
    title: "판교 원룸 월세",
    buildingName: "판교 스마트빌",
    address: "경기도 성남시 분당구 백현동 534",
    type: "원룸",
    roomType: "원룸",
    area: "23㎡ (7평)",
    floor: "4층",
    deposit: "500만원",
    monthly: "65만원",
    isNew: true,
    isHot: false,
    views: 740,
    lat: 37.3918,
    lng: 127.1110,
    image: property5,
    description: "판교역 인근 원룸. 신축 건물, 에어컨, 세탁기 포함. IT 종사자 선호.",
    buildingMemo: "CCTV 완비, 택배함 설치, 주변 카페 다수",
    roomMemo: "신축, 인터넷 기가급, 창문 2개 채광 좋음",
    registeredDate: "2024-01-18",
    checkedDate: "2024-02-05",
    buildingPassword: "5678#",
    options: ["에어컨", "세탁기", "냉장고", "인덕션", "전자키"],
    contactManager: "031-5555-6666",
    contact: "031-5555-6666",
    agentName: "판교공인",
    manageFee: "5만원",
    parking: "없음",
    elevator: true,
    availableFrom: "즉시",
    totalFloors: "지상 7층",
    buildYear: "2021년",
  },
  {
    id: 306,
    title: "신촌 투룸 반전세",
    buildingName: "신촌 하우스",
    address: "서울특별시 서대문구 창천동 56-2",
    type: "투룸",
    roomType: "투룸",
    area: "43㎡ (13평)",
    floor: "2층",
    deposit: "5,000만원",
    monthly: "50만원",
    isNew: false,
    isHot: false,
    views: 550,
    lat: 37.5548,
    lng: 126.9370,
    image: property6,
    description: "신촌역 도보 5분 투룸. 대학가 인근, 반전세. 인테리어 상태 양호.",
    buildingMemo: "인테리어 공사 허용, 업종 제한 없음",
    roomMemo: "2층 남향, 채광 좋음, 세탁기 신형",
    registeredDate: "2024-01-03",
    checkedDate: "2024-01-19",
    buildingPassword: "9876#",
    roomPassword: "4321*",
    options: ["에어컨", "세탁기", "냉장고", "책상", "옷장"],
    contactOwner: "010-7777-8888",
    contact: "02-6666-7777",
    agentName: "신촌공인중개",
    manageFee: "7만원",
    parking: "없음",
    elevator: false,
    availableFrom: "즉시",
    totalFloors: "지상 4층",
    buildYear: "2010년",
  },
];

const RESIDENTIAL_SUBTYPES = ["전체", "원룸", "투베이", "투룸", "쓰리룸", "주인세대", "아파트", "오피스텔", "빌라"];

const RESIDENTIAL_DB_TYPES = ["원룸", "투베이", "투룸", "쓰리룸", "주인세대", "아파트", "오피스텔", "빌라", "고시원"];

const ResidentialRental = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTypes, setActiveTypes] = useState<string[]>(["전체"]);
  const [query, setQuery] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [showLandlord, setShowLandlord] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // DB 매물 (주거형)
  const { properties: dbProperties } = useDBProperties(RESIDENTIAL_DB_TYPES);

  // static + DB 합치기
  const allProperties = useMemo(
    () => [...RESIDENTIAL_PROPERTIES, ...dbProperties],
    [dbProperties]
  );

  const toggleType = (t: string) => {
    if (t === "전체") {
      setActiveTypes(["전체"]);
      return;
    }
    setActiveTypes(prev => {
      const without전체 = prev.filter(x => x !== "전체");
      if (without전체.includes(t)) {
        const next = without전체.filter(x => x !== t);
        return next.length === 0 ? ["전체"] : next;
      }
      return [...without전체, t];
    });
  };

  const filtered = usePropertyFilter(allProperties, filters, activeTypes, query, propertyId);

  const activeType = activeTypes[0] ?? "전체";

  return (
    <div className="flex flex-col" style={{ height: "100vh" }}>
      <Header onRegisterChange={setShowRegister} />
      {showLandlord && <LandlordSearchModal onClose={() => setShowLandlord(false)} />}

      {/* 주거 유형 탭 - 다중 선택 */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto"
        style={{ background: "hsl(var(--header-bg))" }}
      >
        <span className="text-white/50 text-xs font-semibold whitespace-nowrap flex-shrink-0">주거 유형</span>
        {RESIDENTIAL_SUBTYPES.map(t => {
          const isActive = activeTypes.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all flex-shrink-0"
              style={
                isActive
                  ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }
                  : { background: "transparent", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }
              }
            >
              {t}
            </button>
          );
        })}
        {/* 선택 삭제 - 전체 외 2개 이상 선택 시 표시 */}
        {!activeTypes.includes("전체") && activeTypes.length > 1 && (
          <button
            onClick={() => setActiveTypes(["전체"])}
            className="ml-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border whitespace-nowrap flex-shrink-0 transition-all"
            style={{ color: "hsl(var(--destructive))", borderColor: "hsl(var(--destructive))", background: "transparent" }}
          >
            선택 삭제
          </button>
        )}
      </div>

      <main
        className="flex-1 overflow-hidden flex relative"
        style={{ minHeight: 0 }}
      >
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
            hideSearchBar={showRegister}
            showResidentialTypes={true}
            showBuildingOptions={true}
            showRoomTypes={false}
          />
        </div>
        <MapSidebar
          properties={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          activeType={activeType}
          onTypeChange={(t) => toggleType(t)}
        />
      </main>
    </div>
  );
};

export default ResidentialRental;
