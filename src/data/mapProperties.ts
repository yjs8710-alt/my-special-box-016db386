import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";
import property4 from "@/assets/property4.jpg";
import property5 from "@/assets/property5.jpg";
import property6 from "@/assets/property6.jpg";

export interface MapProperty {
  id: number;
  title: string;
  buildingName?: string;
  address: string;
  type: string;
  roomType?: string; // 원룸, 투베이, 투룸, 쓰리룸 등
  unitNumber?: string; // 호수
  area: string;
  floor: string;
  deposit: string;
  monthly: string;
  isNew?: boolean;
  isHot?: boolean;
  views: number;
  lat: number;
  lng: number;
  image: string;
  description: string;
  buildingMemo?: string; // 건물 메모
  roomMemo?: string;     // 방 메모
  memo?: string;         // 레거시 호환
  registeredDate?: string; // 등록일
  checkedDate?: string;    // 확인일
  options?: string[];      // 옵션 아이콘
  note?: string;           // 특이사항
  vacateDate?: string;     // 퇴거일
  buildingPassword?: string; // 건물 비번
  password?: string;         // 레거시 호환 (현관 비번)
  roomPassword?: string;     // 방 비번
  images?: string[];       // 여러장 사진
  contact: string;
  contactOwner?: string;
  contactManager?: string;
  contactTenant?: string;
  agentName: string;
  manageFee: string;
  parking: string;
  elevator: boolean;
  availableFrom: string;
  totalFloors: string;
  buildYear: string;
}

export const MAP_PROPERTIES: MapProperty[] = [
  {
    id: 7,
    title: "을지로 인쇄거리 카페 임대",
    buildingName: "을지로 레트로빌딩",
    address: "서울특별시 중구 을지로3가 299",
    type: "식당·카페",
    roomType: "카페",
    unitNumber: "1층 전체",
    area: "49㎡ (15평)",
    floor: "1층",
    deposit: "4,000만원",
    monthly: "200만원",
    isNew: true,
    isHot: false,
    views: 2890,
    lat: 37.5663,
    lng: 126.9919,
    image: property1,
    description: "힙한 을지로 인쇄거리 감성 카페 임대입니다. 노출 콘크리트 인테리어 그대로 활용 가능, 전기 용량 충분. 을지로 특유의 레트로 감성으로 SNS 핫플레이스 창업에 이상적.",
    memo: "노출콘크리트 인테리어 유지, 전기용량 충분",
    registeredDate: "2026-02-01",
    checkedDate: "2024-01-28",
    options: ["에어컨", "전자레인지", "냉장고"],
    contact: "02-6789-0123",
    agentName: "을지로중개사",
    manageFee: "15만원",
    parking: "없음",
    elevator: false,
    availableFrom: "즉시 입주",
    totalFloors: "지상 5층",
    buildYear: "1985년",
  },
  {
    id: 8,
    title: "성수동 카페거리 트렌디 공실",
    buildingName: "성수 크리에이티브센터",
    address: "서울특별시 성동구 성수2가 325",
    type: "식당·카페",
    roomType: "카페/플래그십",
    unitNumber: "1층 전체",
    area: "99㎡ (30평)",
    floor: "1층",
    deposit: "6,000만원",
    monthly: "450만원",
    isNew: false,
    isHot: true,
    views: 7230,
    lat: 37.5448,
    lng: 127.0567,
    image: property2,
    description: "성수동 카페 거리 핵심 위치의 대형 공실입니다. 천장고 4.5m의 독특한 공간감, 전면 통유리. 성수동 팝업스토어·플래그십 스토어 수요 급증으로 높은 임대 가치를 가집니다.",
    memo: "천장고 4.5m, 팝업/플래그십 최적",
    registeredDate: "2026-02-05",
    checkedDate: "2024-01-30",
    options: ["에어컨", "전자키"],
    password: "2468#",
    contact: "02-7890-1234",
    agentName: "성수공간중개",
    manageFee: "50만원",
    parking: "2대",
    elevator: false,
    availableFrom: "2024-03-15",
    totalFloors: "지상 4층",
    buildYear: "2012년",
  },
  {
    id: 9,
    title: "종로 사직동 소형 사무실",
    buildingName: "광화문 사직빌딩",
    address: "서울특별시 종로구 사직동 8-1",
    type: "사무실",
    roomType: "소형사무실",
    unitNumber: "301호",
    area: "66㎡ (20평)",
    floor: "3층",
    deposit: "3,000만원",
    monthly: "180만원",
    isNew: false,
    isHot: false,
    views: 1023,
    lat: 37.5762,
    lng: 126.9704,
    image: property3,
    description: "경복궁 인근 조용한 업무환경의 소형 사무실입니다. 자연채광이 풍부하며 인테리어 상태 양호. 광화문·종로 업무지구 인접으로 관공서·법무·회계 사무소에 적합.",
    memo: "자연채광 풍부, 인테리어 양호",
    registeredDate: "2026-02-08",
    checkedDate: "2024-01-12",
    options: ["에어컨", "전자키", "냉장고"],
    password: "7777#",
    contact: "02-8901-2345",
    agentName: "종로부동산",
    manageFee: "20만원",
    parking: "1대",
    elevator: true,
    availableFrom: "즉시 입주",
    totalFloors: "지상 6층",
    buildYear: "2000년",
  },
  {
    id: 10,
    title: "잠실 롯데월드몰 인근 상가",
    buildingName: "잠실 스타필드빌딩",
    address: "서울특별시 송파구 신천동 7-21",
    type: "상가",
    roomType: "대형상가",
    unitNumber: "1층 전체",
    area: "115㎡ (35평)",
    floor: "1층",
    deposit: "1억원",
    monthly: "600만원",
    isNew: true,
    isHot: true,
    views: 4512,
    lat: 37.5133,
    lng: 127.1028,
    image: property4,
    description: "잠실 롯데월드몰 인근 초대형 상권의 핵심 위치입니다. 주말·휴일 유동인구 최상위, 관광객 방문 다수. 현재 인테리어 양호하며 다양한 업종 운영 가능. 잠실역 2호선·8호선 환승역 인근.",
    memo: "주말 유동인구 최상위, 관광객 방문 다수",
    registeredDate: "2026-02-12",
    checkedDate: "2024-01-29",
    options: ["에어컨", "전자키", "주차"],
    password: "3690*",
    contact: "02-9012-3456",
    agentName: "잠실공실박스",
    manageFee: "60만원",
    parking: "5대",
    elevator: false,
    availableFrom: "2024-02-20",
    totalFloors: "지상 7층",
    buildYear: "2008년",
  },
];
