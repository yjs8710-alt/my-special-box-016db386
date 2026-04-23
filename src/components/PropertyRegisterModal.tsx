import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatPhone } from "@/lib/utils";
import { X, Building2, Phone, MapPin, ChevronDown, ImagePlus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { prefetchPropertySummary } from "@/lib/prefetchPropertySummary";
import cctvIcon from "@/assets/cctv_icon.png";
import remodelingIcon from "@/assets/remodeling-icon.png";
import tvIcon from "@/assets/tv_icon.png";
import waterIcon from "@/assets/water_icon.png";
import elevatorIcon from "@/assets/elevator_icon.png";
import internetIcon from "@/assets/internet_icon.png";
import petIcon from "@/assets/pet_icon.png";
import memoIcon from "@/assets/memo_icon_new.png";

/* ─── Address Data ─── */
const CHEONGJU_SIGUNGU = [
  "청주시 상당구","청주시 서원구","청주시 흥덕구","청주시 청원구",
];

const DONG_MAP: Record<string, string[]> = {
  "청주시 상당구": ["가덕면","금천동","남문로1가","남문로2가","남일면","남주동","낭성면","대성동","명암동","문의면","문화동","미원면","방서동","북문로1가","북문로2가","북문로3가","산성동","서문동","석교동","수동","영동","영운동","용담동","용암동","용정동","운동동","월오동","중앙동","지북동","탑동","평촌동"],
  "청주시 서원구": ["개신동","남이면","모충동","미평동","분평동","사직동","사창동","산남동","성화동","수곡동","장성동","장암동","죽림동","현도면"],
  "청주시 흥덕구": ["가경동","강내면","강서동","남촌동","내곡동","동막동","문암동","복대동","봉명동","비하동","상신동","서촌동","석곡동","석소동","송절동","송정동","수의동","신대동","신봉동","신성동","신전동","신촌동","오송읍","옥산면","외북동","운천동","원평동","정봉동","지동동","평동","향정동","현암동","화계동","휴암동"],
  "청주시 청원구": ["내덕동","내수읍","북이면","사천동","오근장동","오동동","오창읍","외남동","외평동","외하동","우암동","율량동","정북동","정상동","정하동","주성동","주중동"],
};

/* ─── Constants ─── */
const BROKER_TYPES = ["일반중개","공동중개"] as const;
const TRADE_TYPES = ["임대","매매"] as const;
const BUILDING_TYPES = ["단독건물","집합건물","토지"] as const;

// 집합건물로 취급할 세부 유형 (호수별 연락처 저장/조회)
const COLLECTIVE_DETAIL_TYPES = ["아파트","오피스텔","빌라","연립","다세대","주상복합"] as const;
const PROPERTY_TYPE_GROUPS_REG = [
  { group: "주거형 임대", types: ["원룸","투베이","투룸","쓰리룸","포룸","주인세대","고시원","다가구","단독주택","아파트","오피스텔","빌라","연립","다세대","주상복합"] },
  { group: "상가 임대", types: ["상가","사무실","공장·창고","지식산업","기타임대"] },
  { group: "매매", types: ["단독매매","다가구매매","다중매매","상가주택매매","상가건물매매","구분상가매매","창고/공장매매","지식산업매매"] },
  { group: "토지", types: ["토지"] },
];
// 전체 세부종류 flat 목록 (타입 추론용)
const ALL_DETAIL_TYPES = PROPERTY_TYPE_GROUPS_REG.flatMap((g) => g.types);

const BUILDING_SALE_TYPES = ["일반건물","집합건물","토지"] as const;
type BuildingSaleType = typeof BUILDING_SALE_TYPES[number];
const ROOM_OPTIONS = [
  "냉장고","세탁기","드럼세탁기","건조기","스타일러","TV",
  "에어컨","가스레인지","인덕션","전자레인지","침대","책상",
  "옷장","전자키","복층","옥탑","테라스","주차",
] as const;

type PetType = "가능" | "불가" | "";
const LH_TYPES = ["관계없음","LH가능","LH불가"] as const;
const VACANCY_TYPES = ["공실","세입자 거주중"] as const;
const FLOOR_OPTIONS = [
  "지하5층","지하4층","지하3층","지하2층","지하1층","0층",
  ...Array.from({ length: 50 }, (_, i) => `${i + 1}층`),
  "50층이상",
];
const DIRECTION_OPTIONS = ["동","서","남","북","동남","남서","북동","북서"];

type BrokerType = typeof BROKER_TYPES[number];
type TradeType = typeof TRADE_TYPES[number];
type BuildingType = typeof BUILDING_TYPES[number];
type DetailType = typeof ALL_DETAIL_TYPES[number] | "";
type VacancyType = typeof VACANCY_TYPES[number];
type LhType = typeof LH_TYPES[number];

// 임대 방식 (복수 선택 가능)
const RENT_MODES = ["월세", "반전세", "전세"] as const;
type RentMode = typeof RENT_MODES[number];

type OneRoomLayout = "오픈형" | "분리형" | "";

interface FormState {
  brokerType: BrokerType;
  tradeType: TradeType;
  buildingType: BuildingType;
  detailType: DetailType;
  oneRoomLayout: OneRoomLayout;
  sido: string;
  sigungu: string;
  dong: string;
  lotNumber: string;
  buildingName: string;
  floor: string;
  unitNo: string;
  area: string;
  landArea: string;      // 매매: 대지(평)
  buildingArea: string;  // 매매: 건평
  totalFloors: string;   // 매매: 전체 층수
  buildYear: string;     // 매매: 건축년도
  buildingSaleType: BuildingSaleType; // 건물매매: 일반건물/집합건물/토지
  options: string[];
  facilities: string[];
  pet: PetType;
  buildingPassword: string;
  roomPassword: string;
  direction: string;
  vacancy: VacancyType;
  // 임대 방식 복수 선택
  rentModes: RentMode[];
  // 월세
  deposit: string;
  monthlyRent: string;
  // 반전세
  halfDeposit: string;
  halfMonthly: string;
  // 전세
  jeonseDeposit: string;
  managementFee: string;
  salePrice: string;
  keyMoney: string;
  lhType: LhType;
  exitCleanFee: string;
  brokerFee: string;
  myMemo: string;
  description: string;
  contactBroker: string;
  contactOwner: string;
  contactOwner2: string;
  contactTenant: string;
  contactManager: string;
  roadAddress: string;
  tenantOccupied: boolean;      // 아파트매매: 세입자 거주여부
  tenantDeposit: string;        // 아파트매매: 세입자 전세/보증금
  tenantMonthly: string;        // 아파트매매: 세입자 월세
  vacateDate: string;           // 퇴거 예정일 (임대/매매 공통)
  earlyExit: boolean;           // 세입자 중도퇴거 여부 (임대 전용)
  expose: boolean;
  allowAddressView: boolean;
  images: string[];
  elevator: boolean;
  isNew: boolean;
  isHot: boolean;
  buildingMemo: string;
  buildingDong: string; // 집합건물 동(棟)
}

const INITIAL: FormState = {
  brokerType: "일반중개", tradeType: "임대", buildingType: "단독건물",
  detailType: "",
  oneRoomLayout: "",
  sido: "충북", sigungu: "", dong: "", lotNumber: "",
  buildingName: "", floor: "", unitNo: "", area: "",
  landArea: "", buildingArea: "", buildingSaleType: "일반건물",
  totalFloors: "", buildYear: "",
  options: [], facilities: [], pet: "",
  buildingPassword: "", roomPassword: "", direction: "",
  vacancy: "공실",
  rentModes: ["월세"],
  deposit: "", monthlyRent: "",
  halfDeposit: "", halfMonthly: "",
  jeonseDeposit: "",
  managementFee: "",
  salePrice: "", keyMoney: "",
  lhType: "관계없음", exitCleanFee: "", brokerFee: "",
  myMemo: "",
  description: "",
  contactBroker: "", contactOwner: "", contactOwner2: "", contactTenant: "", contactManager: "",
  roadAddress: "",
  tenantOccupied: false, tenantDeposit: "", tenantMonthly: "", vacateDate: "",
  earlyExit: false,
  expose: true, allowAddressView: false,
  images: [],
  elevator: false, isNew: false, isHot: false, buildingMemo: "",
  buildingDong: "",
};

const STEP_LABELS = ["기본 설정 및 주소", "옵션 및 조건", "연락처 및 사진"];

interface Props {
  onClose: () => void;
  /** 종료된 매물 등 기존 매물 정보를 그대로 가져와서 새 매물로 재등록할 때 사용 */
  prefill?: Record<string, unknown>;
}

/** DB row → FormState 매핑 (재등록용) */
function dbRowToFormState(row: Record<string, unknown>): Partial<FormState> {
  const get = (k: string) => (row[k] == null ? "" : String(row[k]));
  const note = get("note");
  const parseNote = (key: string): string => {
    const pattern = key === "건물주"
      ? /건물주(?!2)[:\s]+([^\n|]+)/
      : new RegExp(`${key}[:\\s]+([^\\n|]+)`);
    const m = note.match(pattern);
    return m ? m[1].trim() : "";
  };
  const roadAddr = parseNote("도로명");
  const districtVal = get("district");
  const sigunguVal = districtVal ? `청주시 ${districtVal}` : "";
  const detailType = get("type");
  const roomType = get("room_type");
  const allOptions = Array.isArray(row.options) ? (row.options as string[]) : [];
  const petOpt = allOptions.find((o) => o.startsWith("반려동물_"));
  const facilityNames = ["엘리베이터","수도","인터넷","TV","CCTV","리모델링"];
  const facilities = allOptions.filter((o) => facilityNames.includes(o));
  const options = allOptions.filter((o) => !facilityNames.includes(o) && !o.startsWith("반려동물_"));
  const buildingSaleType: BuildingSaleType =
    (BUILDING_SALE_TYPES as readonly string[]).includes(roomType) ? (roomType as BuildingSaleType) : "일반건물";
  const isBuildingSaleRow = detailType.includes("매매");
  const isLand = detailType === "토지";
  const buildingType: BuildingType = isLand
    ? "토지"
    : (COLLECTIVE_DETAIL_TYPES as readonly string[]).includes(detailType)
      ? "집합건물"
      : "단독건물";
  const tradeType: TradeType = isBuildingSaleRow ? "매매" : "임대";
  // 면적에서 대지/건평 분리 (매매)
  let landArea = "", buildingArea = "", area = get("area");
  if (isBuildingSaleRow && area.includes("/")) {
    const lm = area.match(/대지\s*([0-9.]+)/);
    const bm = area.match(/건평\s*([0-9.]+)/);
    if (lm) landArea = lm[1];
    if (bm) buildingArea = bm[1];
    area = "";
  }
  // rentModes 추출 (note의 "월세:", "반전세:", "전세:" 패턴)
  const rentModes: RentMode[] = [];
  if (/월세[:\s]/.test(note) && !/반전세/.test(note.match(/월세[:\s][^\n]*/)?.[0] ?? "")) rentModes.push("월세");
  if (/반전세[:\s]/.test(note)) rentModes.push("반전세");
  if (/전세[:\s]/.test(note) && !/반전세/.test(note)) rentModes.push("전세");
  if (rentModes.length === 0 && tradeType === "임대") rentModes.push("월세");

  const wolseM = note.match(/월세:\s*보증금\s*([0-9]+).*?월세\s*([0-9]+)/);
  const halfM = note.match(/반전세:\s*보증금\s*([0-9]+).*?월세\s*([0-9]+)/);
  const jeonseM = note.match(/전세:\s*보증금\s*([0-9]+)/);
  const directionM = note.match(/방향:\s*([^\n|]+)/);
  const lhM = note.match(/LH:\s*([^\n|]+)/);
  const cleanM = note.match(/청소비:\s*([^\n|]+)/);
  const brokerFeeM = note.match(/중개보수:\s*([^\n|]+)/);
  const keyMoneyM = note.match(/권리금:\s*([^\n|]+)/);
  const buildingDongM = note.match(/동\(棟\):\s*([^\n|]+)/);
  const tenantDepositM = note.match(/세입자전세금:\s*([^\n|]+)/);
  const tenantMonthlyM = note.match(/세입자월세:\s*([^\n|]+)/);

  return {
    brokerType: "일반중개",
    tradeType,
    buildingType,
    detailType: detailType as DetailType,
    oneRoomLayout: detailType === "원룸" && (roomType === "오픈형" || roomType === "분리형") ? (roomType as OneRoomLayout) : "",
    sido: "충북",
    sigungu: sigunguVal,
    dong: get("dong"),
    lotNumber: get("lot_number"),
    buildingName: get("building_name"),
    floor: get("floor"),
    unitNo: get("unit_number"),
    area,
    landArea,
    buildingArea,
    totalFloors: get("total_floors"),
    buildYear: get("build_year"),
    buildingSaleType,
    options,
    facilities,
    pet: (petOpt ? petOpt.replace("반려동물_", "") : "") as PetType,
    buildingPassword: get("building_password"),
    roomPassword: get("room_password"),
    direction: directionM ? directionM[1].trim() : "",
    vacancy: (get("available_from") === "세입자 거주중" ? "세입자 거주중" : "공실") as VacancyType,
    rentModes,
    deposit: wolseM ? wolseM[1] : (tradeType === "임대" && !isBuildingSaleRow ? get("deposit") : ""),
    monthlyRent: wolseM ? wolseM[2] : (tradeType === "임대" && !isBuildingSaleRow ? get("monthly") : ""),
    halfDeposit: halfM ? halfM[1] : "",
    halfMonthly: halfM ? halfM[2] : "",
    jeonseDeposit: jeonseM ? jeonseM[1] : "",
    managementFee: get("manage_fee"),
    salePrice: (isBuildingSaleRow || tradeType === "매매") ? get("deposit") : "",
    keyMoney: keyMoneyM ? keyMoneyM[1].trim() : "",
    lhType: (lhM && (LH_TYPES as readonly string[]).includes(lhM[1].trim()) ? lhM[1].trim() : "관계없음") as LhType,
    exitCleanFee: cleanM ? cleanM[1].trim() : "",
    brokerFee: brokerFeeM ? brokerFeeM[1].trim() : "",
    myMemo: get("room_memo"),
    description: get("description"),
    contactBroker: parseNote("부동산"),
    contactOwner: parseNote("건물주"),
    contactOwner2: parseNote("건물주2"),
    contactTenant: parseNote("세입자"),
    contactManager: parseNote("관리인"),
    roadAddress: roadAddr,
    tenantOccupied: /세입자거주:\s*예/.test(note),
    tenantDeposit: tenantDepositM ? tenantDepositM[1].trim() : "",
    tenantMonthly: tenantMonthlyM ? tenantMonthlyM[1].trim() : "",
    vacateDate: "",
    earlyExit: /중도퇴거/.test(note),
    expose: true,
    allowAddressView: false,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    elevator: Boolean(row.elevator),
    isNew: false,
    isHot: false,
    buildingMemo: get("building_memo").startsWith("__PROPOSAL_JSON__") ? "" : get("building_memo"),
    buildingDong: buildingDongM ? buildingDongM[1].trim() : "",
  };
}

export default function PropertyRegisterModal({ onClose, prefill }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>(() =>
    prefill ? { ...INITIAL, ...dbRowToFormState(prefill) } : INITIAL
  );
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [myAgentName, setMyAgentName] = useState("");

  // 로그인 사용자 프로필 이름 자동 로드
  useEffect(() => {
    if (!user?.userId) return;
    supabase
      .from("agent_profiles")
      .select("name")
      .eq("user_id", user.userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setMyAgentName(data.name);
      });
  }, [user?.userId]);

  // 집합건물 여부 판단: 건물유형이 집합건물이거나 세부유형이 아파트/오피스텔/빌라/연립 등
  const isCollectiveBuilding = form.buildingType === "집합건물" || COLLECTIVE_DETAIL_TYPES.some((t) => t === form.detailType);

  // ── 주소(동+번지) 변경 시: ──
  //   1) 단독건물에 한해 연락처 자동 로드(같은 동의 다른 번지 오기재 방지)
  //   2) 건물 비밀번호는 건물유형과 무관하게 같은 건물(동+번지)에서 최신값 자동 로드
  useEffect(() => {
    if (!form.dong || !form.lotNumber) return;
    const run = async () => {
      // (1) 연락처 — 단독건물에서만, 호수 없는 row와 정확히 매칭
      if (!isCollectiveBuilding) {
        const { data } = await supabase
          .from("cheongju_contacts")
          .select("contact_owner,contact_manager,contact_broker,phone")
          .eq("dong", form.dong)
          .eq("lot_number", form.lotNumber)
          .is("unit_number", null)
          .maybeSingle();
        if (data) {
          setForm((prev) => ({
            ...prev,
            contactOwner: prev.contactOwner || data.contact_owner || data.phone || "",
            contactManager: prev.contactManager || data.contact_manager || "",
            contactBroker: prev.contactBroker || data.contact_broker || "",
          }));
        }
      }

      // (2) 건물 비밀번호 — 같은 건물(동+번지)의 최신 매물에서 호수와 무관하게 로드
      const { data: propData } = await supabase
        .from("properties")
        .select("building_password")
        .eq("dong", form.dong)
        .eq("lot_number", form.lotNumber)
        .not("building_password", "is", null)
        .neq("building_password", "")
        .order("registered_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (propData?.building_password) {
        setForm((prev) => ({
          ...prev,
          buildingPassword: prev.buildingPassword || propData.building_password || "",
        }));
      }
    };
    run();
  }, [form.dong, form.lotNumber, isCollectiveBuilding]);

  // ── 집합건물/아파트/오피스텔/빌라 등: 호수 입력 시 해당 호수 소유주 연락처 자동 로드 ──
  useEffect(() => {
    if (!form.dong || !form.unitNo || !isCollectiveBuilding) return;
    const run = async () => {
      // 1순위: cheongju_contacts에서 호수별 소유주 조회
      let q = supabase
        .from("cheongju_contacts")
        .select("contact_owner,contact_manager,contact_broker,phone")
        .eq("dong", form.dong)
        .eq("unit_number", form.unitNo);
      if (form.lotNumber) q = q.eq("lot_number", form.lotNumber);
      const { data: contactData } = await q.maybeSingle();
      if (contactData) {
        setForm((prev) => ({
          ...prev,
          contactOwner: contactData.contact_owner || contactData.phone || prev.contactOwner,
          contactManager: prev.contactManager || contactData.contact_manager || "",
          contactBroker: prev.contactBroker || contactData.contact_broker || "",
        }));
      }

      // 2순위: 이전 매물에서 비밀번호 자동 로드 (이미지는 복사하지 않음)
      let propQuery = supabase
        .from("properties")
        .select("building_password,room_password")
        .eq("dong", form.dong)
        .eq("unit_number", form.unitNo);
      if (form.lotNumber) propQuery = propQuery.eq("lot_number", form.lotNumber);
      const { data: propData } = await propQuery
        .order("registered_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!propData) return;
      setForm((prev) => ({
        ...prev,
        buildingPassword: prev.buildingPassword || propData.building_password || "",
        roomPassword: prev.roomPassword || propData.room_password || "",
      }));
    };
    run();
  }, [form.dong, form.unitNo, form.buildingType, form.detailType, form.lotNumber]);

  // ── 단독건물: 호수 입력 시 이전 매물 비밀번호만 자동 로드 ──────────
  useEffect(() => {
    if (!form.dong || !form.unitNo || isCollectiveBuilding) return;
    const run = async () => {
      let q = supabase
        .from("properties")
        .select("building_password,room_password")
        .eq("dong", form.dong)
        .eq("unit_number", form.unitNo)
        .eq("status", "active");
      if (form.lotNumber) q = q.eq("lot_number", form.lotNumber);
      const { data } = await q
        .order("registered_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) return;
      setForm((prev) => ({
        ...prev,
        buildingPassword: prev.buildingPassword || data.building_password || "",
        roomPassword: prev.roomPassword || data.room_password || "",
      }));
    };
    run();
  }, [form.dong, form.unitNo, form.buildingType, form.detailType, form.lotNumber]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const toggleOption = (opt: string) =>
    set("options", form.options.includes(opt)
      ? form.options.filter((o) => o !== opt)
      : [...form.options, opt]);

  /* ─── 이미지 업로드 ─── */
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `properties/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("property-images").upload(path, file, { upsert: false });
      if (error) { console.error("업로드 실패:", error.message); continue; }
      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
      if (urlData?.publicUrl) newUrls.push(urlData.publicUrl);
    }
    if (newUrls.length > 0) setForm((f) => ({ ...f, images: [...f.images, ...newUrls] }));
    setUploading(false);
  };

  const removeImage = (url: string) =>
    setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }));

  const setMainImage = (url: string) =>
    setForm((f) => ({ ...f, images: [url, ...f.images.filter((u) => u !== url)] }));

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.sigungu) e.sigungu = "시/군/구를 선택해주세요";
    if (!form.dong) e.dong = "동을 선택해주세요";
    if (form.buildingType !== "토지" && !form.detailType) e.detailType = "세부 종류를 선택해주세요";
    if (form.detailType === "원룸" && !form.oneRoomLayout) e.oneRoomLayout = "원룸 형태(오픈형/분리형)를 선택해주세요";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    const isSale = form.detailType === "건물매매" || form.tradeType === "매매";
    const isLand = form.detailType === "토지" || form.buildingType === "토지";
    const isCommercial = ["상가","사무실","공장·창고","지식산업"].includes(form.detailType);
    if (isSale) {
      if (!form.salePrice.trim()) e.amount = "매매가를 입력해주세요";
    } else if (!isLand && !isCommercial) {
      const hasJeonse = form.rentModes.includes("전세") && form.jeonseDeposit.trim();
      const hasHalf = form.rentModes.includes("반전세") && (form.halfDeposit.trim() || form.halfMonthly.trim());
      const hasWolse = form.rentModes.includes("월세") && (form.deposit.trim() || form.monthlyRent.trim());
      if (!hasJeonse && !hasHalf && !hasWolse && !form.deposit.trim() && !form.monthlyRent.trim()) {
        e.amount = "보증금 또는 월세를 입력해주세요";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    setSaveError("");

    let address = ["충북", form.sigungu, form.dong, form.lotNumber].filter(Boolean).join(" ");
    const districtVal = form.sigungu ? form.sigungu.replace("청주시 ", "") : null;
    let finalDong = form.dong;
    let finalLotNumber = form.lotNumber;

    // ── Geocoding: 주소 → 좌표 + 도로명 ─────────────────────────────────
    let lat = 0;
    let lng = 0;
    let finalRoadAddress = form.roadAddress || "";
    try {
      const geoAddress = ["충북 청주시", form.sigungu.replace("청주시 ", ""), form.dong, form.lotNumber].filter(Boolean).join(" ");
      const { data: geoData, error: geoErr } = await supabase.functions.invoke("geocode", {
        body: { address: geoAddress },
      });
      if (!geoErr && geoData?.success) {
        lat = geoData.lat;
        lng = geoData.lng;
        // 도로명주소 저장
        if (geoData.roadAddress && !finalRoadAddress) {
          finalRoadAddress = geoData.roadAddress as string;
        }
        // 도로명 입력 시 지번 주소로 자동 변환
        if (geoData.jibunAddress) {
          const jibunMatch = (geoData.jibunAddress as string).match(/([가-힣]+[동리읍면])\s+([\d-]+)$/);
          if (jibunMatch) {
            finalDong = jibunMatch[1];
            finalLotNumber = jibunMatch[2];
            address = ["충북", form.sigungu, finalDong, finalLotNumber].filter(Boolean).join(" ");
          }
        }
      } else {
        console.warn("[geocode] 좌표 변환 실패:", geoErr?.message ?? geoData?.error);
      }
    } catch (e) {
      console.warn("[geocode] 예외:", e);
    }

    const contactParts = [
      form.contactOwner && `건물주:${form.contactOwner}`,
      form.contactOwner2 && `건물주2:${form.contactOwner2}`,
      form.contactBroker && `부동산:${form.contactBroker}`,
      form.contactTenant && `세입자:${form.contactTenant}`,
      form.contactManager && `관리인:${form.contactManager}`,
    ].filter(Boolean).join("|");

    const isBuildingSale = ["건물매매","단독매매","창고/공장매매","구분상가매매","상가주택매매","상가건물매매","다가구매매","다중매매"].includes(form.detailType);
    const isCommercialLease = ["상가","사무실","공장·창고","지식산업"].includes(form.detailType);

    // 임대 방식별 금액 정리 (월세/반전세/전세 복수 가능)
    const hasWolse = form.rentModes.includes("월세");
    const hasHalf = form.rentModes.includes("반전세");
    const hasJeonse = form.rentModes.includes("전세");

    // deposit: 대표 보증금 (월세 우선, 없으면 반전세, 없으면 전세)
    const mainDeposit = (isBuildingSale || form.tradeType === "매매")
      ? form.salePrice
      : hasWolse ? form.deposit : hasHalf ? form.halfDeposit : hasJeonse ? form.jeonseDeposit : form.deposit;
    const mainMonthly = (isBuildingSale || form.tradeType === "매매")
      ? ""
      : hasWolse ? form.monthlyRent : hasHalf ? form.halfMonthly : "";

    // note에 임대 방식별 상세 금액 저장
    const rentNotes: string[] = [];
    if (form.tradeType === "임대" && !isBuildingSale) {
      if (hasWolse && (form.deposit || form.monthlyRent)) rentNotes.push(`월세: 보증금 ${form.deposit || "0"}만원 / 월세 ${form.monthlyRent || "0"}만원`);
      if (hasHalf && (form.halfDeposit || form.halfMonthly)) rentNotes.push(`반전세: 보증금 ${form.halfDeposit || "0"}만원 / 월세 ${form.halfMonthly || "0"}만원`);
      if (hasJeonse && form.jeonseDeposit) rentNotes.push(`전세: 보증금 ${form.jeonseDeposit}만원`);
    }

    const payload = {
      title: isBuildingSale
        ? `${form.dong} ${form.detailType} (${form.buildingSaleType})`
        : `${form.dong} ${form.detailType}${form.floor ? ` ${form.floor}` : ""}`,
      building_name: form.buildingName || null,
      address,
      dong: finalDong,
      lot_number: finalLotNumber,
      district: districtVal,
      type: (form.detailType === "토지" || form.buildingType === "토지")
        ? "토지"
        : form.detailType || (form.brokerType === "공동중개" ? "공동중개" : form.tradeType),
      room_type: isBuildingSale ? form.buildingSaleType : (form.detailType === "원룸" && form.oneRoomLayout ? form.oneRoomLayout : (form.detailType || null)),
      unit_number: form.unitNo || null,
      area: isBuildingSale
        ? [form.landArea && `대지 ${form.landArea}`, form.buildingArea && `건평 ${form.buildingArea}`].filter(Boolean).join(" / ")
        : (form.area && !form.area.includes("평") ? (() => { const n = parseFloat(form.area.replace(/[^0-9.]/g, "")); return !isNaN(n) && n > 0 ? `${(n / 3.3058).toFixed(1)}평` : form.area; })() : form.area),
      floor: form.floor,
      deposit: mainDeposit,
      monthly: mainMonthly,
      manage_fee: form.managementFee,
      parking: "",
      available_from: form.vacancy || "",
      total_floors: form.totalFloors || "",
      build_year: form.buildYear || "",
      description: form.description,
      room_memo: form.myMemo || null,
      building_memo: form.buildingMemo || null,
      building_password: form.buildingPassword || null,
      room_password: form.roomPassword || null,
      options: [
        ...form.options,
        ...form.facilities,
        ...(form.pet ? [`반려동물_${form.pet}`] : []),
      ],
      images: form.images,
      views: 0,
      lat,
      lng,
      is_new: false,
      is_hot: false,
      elevator: form.options.includes("엘리베이터"),
      status: "active" as const,
      registered_date: new Date().toISOString().split("T")[0],
      agent_name: myAgentName || contactParts,
      registered_by: user?.userId ?? null,
      note: [
        form.contactOwner && `건물주: ${form.contactOwner}`,
        form.contactOwner2 && `건물주2: ${form.contactOwner2}`,
        form.contactBroker && `부동산: ${form.contactBroker}`,
        form.contactTenant && `세입자: ${form.contactTenant}`,
        form.contactManager && `관리인: ${form.contactManager}`,
        form.keyMoney && `권리금: ${form.keyMoney}`,
        isBuildingSale && form.landArea && `대지: ${form.landArea}`,
        isBuildingSale && form.buildingArea && `건평: ${form.buildingArea}`,
        form.tenantOccupied && `세입자거주: 예`,
        form.tenantOccupied && form.tenantDeposit && `세입자전세금: ${form.tenantDeposit}`,
        form.tenantOccupied && form.tenantMonthly && `세입자월세: ${form.tenantMonthly}`,
        form.vacateDate && `퇴거일: ${form.vacateDate}`,
        form.earlyExit && `중도퇴거: 세입자중도퇴거`,
        isCollectiveBuilding && form.buildingDong && `동(棟): ${form.buildingDong}`,
        ...rentNotes,
        form.direction && `방향: ${form.direction}`,
        form.lhType && form.lhType !== "관계없음" && `LH: ${form.lhType}`,
        form.exitCleanFee && `청소비: ${form.exitCleanFee}`,
        form.brokerFee && `중개보수: ${form.brokerFee}`,
        (finalRoadAddress || form.roadAddress) && `도로명: ${finalRoadAddress || form.roadAddress}`,
      ].filter(Boolean).join("\n") || null,
      vacate_date: form.vacateDate || null,
    };

    const { data: insertedRow, error } = await supabase.from("properties").insert(payload).select("id").single();
    setSaving(false);

    if (!error && form.dong) {
      // ── cheongju_contacts 동기화 ──
      const contactDistrict = districtVal ?? "";
      const hasContact = form.contactOwner || form.contactManager || form.contactBroker;
      const isCollective = form.buildingType === "집합건물" || COLLECTIVE_DETAIL_TYPES.some((t) => t === form.detailType);
      const unitVal = form.unitNo || null;

      // 집합건물 타입이면 호수가 있어야만 저장 (호수 없으면 skip → 단독건물 연락처 오염 방지)
      const canSaveContact = hasContact && (isCollective ? !!unitVal : true);

      if (canSaveContact) {
        const upsertPayload = {
          district: contactDistrict,
          dong: form.dong,
          lot_number: form.lotNumber || "",
          unit_number: isCollective ? unitVal : null,
          phone: form.contactOwner || "",
          contact_owner: form.contactOwner || null,
          contact_manager: form.contactManager || null,
          contact_broker: form.contactBroker || null,
          is_visible: true,
        };
        const { error: contactErr } = await supabase
          .from("cheongju_contacts")
          .upsert(upsertPayload, { onConflict: "dong,lot_number,unit_number" });
        if (contactErr) console.error("[청주연락처] upsert 오류:", contactErr.message);
      }
    }

    if (error) {
      setSaveError("저장 중 오류가 발생했습니다: " + error.message);
      return;
    }

    // ── 건축물대장·토지대장 백그라운드 자동 조회 (캐싱) ──
    if (insertedRow?.id) {
      const address = ["충북", form.sigungu, form.dong, form.lotNumber].filter(Boolean).join(" ");
      prefetchPropertySummary(address, insertedRow.id).catch(() => {});
    }

    setSubmitted(true);
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  const goNext = () => {
    if (step === 1 && validateStep1()) { setStep(2); scrollRef.current?.scrollTo(0, 0); }
    else if (step === 2 && validateStep2()) { setStep(3); scrollRef.current?.scrollTo(0, 0); }
    else if (step === 3 && validateStep3()) handleSubmit();
  };

  const goPrev = () => {
    if (step > 1) { setStep((s) => (s - 1) as 1 | 2 | 3); scrollRef.current?.scrollTo(0, 0); }
  };

  return (
    <div className="fixed inset-0 z-[10200] flex items-center justify-center p-4"
      style={{ background: "rgba(10,20,50,0.55)", backdropFilter: "blur(4px)" }}>
      <div className="bg-card w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(10,45,110,0.25)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
          style={{ background: "hsl(var(--header-bg))" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">매물 등록</h2>
              <p className="text-xs text-white/50">빠르고 간편하게 공실을 등록하세요</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors rounded-lg p-1.5 hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        {!submitted && (
          <div className="px-6 pt-4 pb-2 flex-shrink-0">
            <div className="flex gap-1.5 mb-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{step}/3 {STEP_LABELS[step - 1]}</p>
          </div>
        )}

        {/* Body */}
        {submitted ? <SuccessView onClose={onClose} /> : (
          <div ref={scrollRef} className="overflow-y-auto flex-1 px-6 py-4">
            {step === 1 && <Step1 form={form} set={set} errors={errors} />}
            {step === 2 && <Step2 form={form} set={set} toggleOption={toggleOption} errors={errors} />}
            {step === 3 && (
              <Step3
                form={form}
                set={set}
                errors={errors}
                uploading={uploading}
                fileInputRef={fileInputRef}
                onImageUpload={handleImageUpload}
                onImageRemove={removeImage}
                onImageSetMain={setMainImage}
              />
            )}

            {saveError && (
              <p className="text-xs text-destructive text-center mt-2">{saveError}</p>
            )}

            {/* 숨김 파일 input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files)}
            />

            <div className="flex gap-3 pt-4 pb-2 sticky bottom-0 bg-card">
              <button type="button" onClick={step === 1 ? onClose : goPrev}
                disabled={saving || uploading}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50">
                {step === 1 ? "취소" : "이전"}
              </button>
              <button type="button" onClick={goNext}
                disabled={saving || uploading}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors disabled:opacity-70"
                style={{ boxShadow: "0 4px 16px hsl(var(--primary)/0.3)" }}>
                {saving ? "등록 중..." : uploading ? "사진 업로드 중..." : step === 3 ? "매물 등록" : "다음"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Step 1 ─── */
function Step1({ form, set, errors }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void; errors: Record<string, string> }) {
  const [addressVerified, setAddressVerified] = useState<null | "success" | "fail">(null);
  const [verifying, setVerifying] = useState(false);
  const [oneRoomModalOpen, setOneRoomModalOpen] = useState(false);
  const sigunguList = CHEONGJU_SIGUNGU;
  const dongList = DONG_MAP[form.sigungu] ?? [];

  const handleAddressVerify = async () => {
    const addr = form.lotNumber?.match(/[가-힣].*(로|길)\s/)
      ? form.lotNumber
      : ["충북", form.sigungu, form.dong, form.lotNumber].filter(Boolean).join(" ");
    if (!addr.trim()) return;
    setVerifying(true);
    setAddressVerified(null);
    try {
      const { data, error } = await supabase.functions.invoke("geocode", { body: { address: addr } });
      if (!error && data?.success) {
        setAddressVerified("success");
        // 도로명 입력 시 지번으로 자동 변환
        if (data.jibunAddress) {
          const jibunMatch = (data.jibunAddress as string).match(/([가-힣]+[동리읍면])\s+([\d-]+)$/);
          if (jibunMatch) {
            set("dong", jibunMatch[1]);
            set("lotNumber", jibunMatch[2]);
          }
        }
      } else {
        setAddressVerified("fail");
      }
    } catch {
      setAddressVerified("fail");
    } finally {
      setVerifying(false);
    }

    // 기존 등록된 건물명 자동 가져오기
    if (!form.buildingName && form.dong && form.lotNumber) {
      try {
        const { data: existing } = await supabase
          .from("properties")
          .select("building_name")
          .eq("dong", form.dong)
          .eq("lot_number", form.lotNumber)
          .not("building_name", "is", null)
          .order("registered_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existing?.building_name) {
          set("buildingName", existing.building_name);
        }
      } catch {}
    }
  };
  const isBuildingSale = ["건물매매","단독매매","창고/공장매매","구분상가매매","상가주택매매","상가건물매매","다가구매매","다중매매"].includes(form.detailType);

  return (
    <div className="flex flex-col gap-5">
      {/* 거래 방식 */}
      <Section label="거래 방식">
        <div className="flex gap-5">
          {BROKER_TYPES.map((t) => <Radio key={t} checked={form.brokerType === t} onClick={() => set("brokerType", t)}>{t}</Radio>)}
        </div>
      </Section>

      {/* 거래 종류 */}
      <Section label="거래 종류">
        <div className="flex gap-5">
          {TRADE_TYPES.map((t) => <Radio key={t} checked={form.tradeType === t} onClick={() => set("tradeType", t)}>{t}</Radio>)}
        </div>
      </Section>

      {/* 매물 종류 */}
      <Section label="매물 종류">
        <div className="flex gap-5">
          {BUILDING_TYPES.map((t) => <Radio key={t} checked={form.buildingType === t} onClick={() => set("buildingType", t)}>{t}</Radio>)}
        </div>
      </Section>


      {/* 세부 종류 - 매물종류 토지 선택 시 숨김 */}
      {form.buildingType !== "토지" && (
        <Section label="세부 종류" error={errors.detailType || errors.oneRoomLayout}>
          {PROPERTY_TYPE_GROUPS_REG.filter(({ group }) => !(["단독건물","집합건물"].includes(form.buildingType) && group === "토지")).map(({ group, types }) => (
            <div key={group} className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{group}</span>
              <div className="flex flex-wrap gap-1.5">
                {types.map((t) => (
                  <button key={t} type="button" onClick={() => {
                    set("detailType", t);
                    if (t !== "원룸") {
                      set("oneRoomLayout", "");
                    } else {
                      setOneRoomModalOpen(true);
                    }
                  }}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                    style={form.detailType === t
                      ? { background: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--primary))" }
                      : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                    {t}{t === "원룸" && form.oneRoomLayout ? ` (${form.oneRoomLayout})` : ""}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* 원룸 형태 선택 모달 */}
      {oneRoomModalOpen && (
        <div
          className="fixed inset-0 z-[10300] flex items-center justify-center bg-black/50"
          onClick={() => setOneRoomModalOpen(false)}
        >
          <div
            className="bg-background rounded-2xl shadow-2xl w-[90%] max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">원룸 형태 선택</h3>
              <button
                type="button"
                onClick={() => setOneRoomModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">원룸의 구조 형태를 선택해주세요.</p>
            <div className="grid grid-cols-2 gap-3">
              {(["오픈형", "분리형"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    set("oneRoomLayout", opt);
                    setOneRoomModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-1 py-4 rounded-xl border-2 transition-all"
                  style={form.oneRoomLayout === opt
                    ? { background: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--primary))" }
                    : { borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                >
                  <span className="text-base font-bold">{opt}</span>
                  <span className="text-[10px] opacity-80">
                    {opt === "오픈형" ? "방·주방 일체형" : "방·주방 분리형"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* 주소 입력 */}
      <Section label="주소 입력">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/30 bg-primary/5">
          <span className="text-xs text-muted-foreground">시/도</span>
          <span className="text-sm font-bold text-primary">충청북도 (충북)</span>
          <span className="ml-auto text-[10px] text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full">고정</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            {errors.sigungu && <p className="text-xs text-destructive">{errors.sigungu}</p>}
            <Select value={form.sigungu} onChange={(v) => { set("sigungu", v); set("dong", ""); }} placeholder="시/군/구 선택" options={sigunguList} />
          </div>
          <div className="flex flex-col gap-1">
            {errors.dong && <p className="text-xs text-destructive">{errors.dong}</p>}
            <Select value={form.dong} onChange={(v) => set("dong", v)} placeholder="동/읍/면 선택" options={dongList} disabled={!form.sigungu} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="번지 또는 도로명주소 입력 (예: 123-4 또는 대농로 17)" value={form.lotNumber} onChange={(e) => set("lotNumber", e.target.value)} className={ic(false) + " pl-9"} />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground/60 -mt-1">번지주소 또는 도로명주소 입력 가능</p>
        {/* 주소확인 버튼 */}
        <button type="button" onClick={handleAddressVerify} disabled={verifying || !form.lotNumber}
          className="w-full py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-40"
          style={{ borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))", background: "hsl(var(--primary) / 0.05)" }}>
          {verifying ? "확인 중..." : "📍 주소확인"}
        </button>
        {addressVerified === "success" && (
          <p className="text-[11px] text-green-600 font-semibold">✅ 주소가 확인되었습니다</p>
        )}
        {addressVerified === "fail" && (
          <p className="text-[11px] text-destructive font-semibold">❌ 주소를 찾을 수 없습니다. 다시 확인해주세요</p>
        )}
      </Section>

      {/* 건물이름 - 토지/건물매매/단독매매/창고/공장매매/다가구매매 등 매매 제외 */}
      {!isBuildingSale && form.detailType !== "토지" && form.buildingType !== "토지" && (
        <Section label="건물이름">
          <input type="text" placeholder="건물 이름 (선택)" value={form.buildingName} onChange={(e) => set("buildingName", e.target.value)} className={ic(false)} />
        </Section>
      )}

      {/* 층수 / 호수 / 평수 — 매매 타입은 대지·건평·총층·건축년도 표시 */}
      {isBuildingSale ? (
        <>
          {/* 모든 매매 타입: 대지·건평·총층·건축년도 */}
          <div className="rounded-xl border-2 border-primary/30 bg-primary/4 p-3 flex flex-col gap-3">
            <p className="text-xs font-extrabold text-primary">🏢 건물 기본 정보</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground/70">대지 (평)</label>
                <input type="text" placeholder="예) 100" value={form.landArea} onChange={(e) => set("landArea", e.target.value)} className={ic(false)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground/70">건평</label>
                <input type="text" placeholder="예) 80" value={form.buildingArea} onChange={(e) => set("buildingArea", e.target.value)} className={ic(false)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground/70">총 층수</label>
                <input type="text" placeholder="예) 5층" value={form.totalFloors} onChange={(e) => set("totalFloors", e.target.value)} className={ic(false)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground/70">건축년도</label>
                <input type="text" placeholder="예) 2010" value={form.buildYear} onChange={(e) => set("buildYear", e.target.value)} className={ic(false)} />
              </div>
            </div>
          </div>
        </>
      ) : (form.detailType === "토지" || form.buildingType === "토지") ? (
        /* 토지: 면적만 표시 (층수/호수 숨김) */
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground/70">면적 (평)</label>
          <input type="text" placeholder="예) 200평" value={form.area} onChange={(e) => set("area", e.target.value)} className={ic(false)} />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* 집합건물 동(棟) 입력 */}
          {(form.buildingType === "집합건물" || COLLECTIVE_DETAIL_TYPES.some((t) => t === form.detailType)) && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground/70">집합건물 동(棟) <span className="text-muted-foreground font-normal">(선택)</span></label>
              <input
                type="text"
                placeholder="예) 101동, A동"
                value={form.buildingDong}
                onChange={(e) => set("buildingDong", e.target.value)}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && !/동$/.test(v)) set("buildingDong", `${v}동`);
                }}
                className={ic(false)}
              />
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground/70">층수</label>
              <Select value={form.floor} onChange={(v) => set("floor", v)} placeholder="선택" options={FLOOR_OPTIONS} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground/70">
                호수
                {(form.buildingType === "집합건물" || COLLECTIVE_DETAIL_TYPES.some((t) => t === form.detailType)) && (
                  <span className="ml-1 text-[10px] text-primary font-normal">호수별 소유주 자동로드</span>
                )}
              </label>
              <input type="text" placeholder="직접입력" value={form.unitNo} onChange={(e) => set("unitNo", e.target.value)} className={ic(false)} />
              {form.unitNo && (form.buildingType === "집합건물" || COLLECTIVE_DETAIL_TYPES.some((t) => t === form.detailType)) && (
                <p className="text-[10px] text-primary/70">🏠 이 호수의 소유주 연락처를 자동으로 불러옵니다</p>
              )}
              {form.unitNo && !(form.buildingType === "집합건물" || COLLECTIVE_DETAIL_TYPES.some((t) => t === form.detailType)) && (
                <p className="text-[10px] text-primary/70">✨ 이전 매물 정보 자동 불러오기 가능</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground/70">면적</label>
              <input type="text" placeholder="예) 59.94㎡ 또는 18평" value={form.area} onChange={(e) => set("area", e.target.value)} className={ic(false)} />
              {form.area && !form.area.includes("평") && (() => { const n = parseFloat(form.area.replace(/[^0-9.]/g, "")); return !isNaN(n) && n > 0 ? <p className="text-[10px] text-primary/70">→ 약 {(n / 3.3058).toFixed(1)}평</p> : null; })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Step 2 ─── */
function Step2({
  form, set, toggleOption, errors,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  toggleOption: (opt: string) => void;
  errors: Record<string, string>;
}) {
  const isLand = form.detailType === "토지" || form.buildingType === "토지";
  const isBuildingSale = ["건물매매","단독매매","창고/공장매매","구분상가매매","상가주택매매","상가건물매매","다가구매매","다중매매"].includes(form.detailType);
  const isCommercial = ["상가","사무실","공장·창고","지식산업"].includes(form.detailType);
  const isCollective = form.buildingType === "집합건물" || COLLECTIVE_DETAIL_TYPES.some((t) => t === form.detailType);

  // 매매 타입 목록 (수정폼과 동일)
  const SALE_TYPES = ["매매","단독매매","건물매매","다가구매매","다중매매","상가주택매매","상가건물매매","구분상가매매","창고/공장매매"];
  const isWarehouseSale = SALE_TYPES.includes(form.detailType);

  // 부가 시설 옵션 (아이콘 뱃지로 표시) — 수정폼과 동일
  const EXTRA_FACILITY_OPTIONS: { key: string; label: string; icon: React.ReactNode; bg: string; color: string; border: string }[] = [
    { key: "엘리베이터", label: "엘리베이터", icon: <img src={elevatorIcon} alt="엘리베이터" className="w-5 h-5 object-contain" style={{ imageRendering: '-webkit-optimize-contrast' as any }} />, bg: "#e0f2fe", color: "#0369a1", border: "#7dd3fc" },
    { key: "수도",   label: "수도",   icon: <img src={waterIcon} alt="수도" className="w-5 h-5 object-contain" style={{ imageRendering: '-webkit-optimize-contrast' as any }} />, bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd" },
    { key: "유선TV", label: "유선TV", icon: <img src={tvIcon} alt="유선TV" className="w-5 h-5 object-contain" style={{ imageRendering: '-webkit-optimize-contrast' as any }} />, bg: "#faf5ff", color: "#7e22ce", border: "#d8b4fe" },
    { key: "인터넷", label: "인터넷", icon: <img src={internetIcon} alt="인터넷" className="w-5 h-5 object-contain" style={{ imageRendering: '-webkit-optimize-contrast' as any }} />, bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
    { key: "CCTV",  label: "CCTV",  icon: <img src={cctvIcon} alt="CCTV" className="w-5 h-5 object-contain" style={{ imageRendering: '-webkit-optimize-contrast' as any }} />, bg: "#f8fafc", color: "#475569", border: "#cbd5e1" },
    { key: "리모델링", label: "리모델링", icon: <img src={remodelingIcon} alt="리모델링" className="w-5 h-5 object-contain" style={{ imageRendering: '-webkit-optimize-contrast' as any }} />, bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* 요약 칩 */}
      <div className="flex gap-1.5 flex-wrap">
        {[form.brokerType, form.tradeType, form.buildingType, form.detailType].filter(Boolean).map((v) => (
          <span key={v} className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">{v}</span>
        ))}
      </div>

      {/* 부가 시설 — 매매/상가임대류/토지 제외 */}
      {!isWarehouseSale && !isCommercial && !isLand && (
        <Section label="부가 시설">
          <div className="flex flex-wrap gap-2">
            {EXTRA_FACILITY_OPTIONS.map(({ key, label, icon, bg, color, border }) => {
              const isActive = form.options.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    const cur = form.options;
                    set("options", isActive ? cur.filter((o) => o !== key) : [...cur, key]);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all select-none"
                  style={isActive
                    ? { background: color, color: "#fff", borderColor: color }
                    : { background: bg, color, borderColor: border }
                  }
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* 옵션 — 매매/상가임대류/토지 제외 */}
      {!isWarehouseSale && !isCommercial && !isLand && (
        <Section label="옵션">
          {/* 풀옵션 버튼 */}
          <div className="mb-2">
            <button
              type="button"
              onClick={() => {
                const FULL_OPTIONS = ["냉장고","세탁기","에어컨","TV","전자레인지","인터넷","가스레인지","수도"];
                const current = new Set(form.options);
                const allSelected = FULL_OPTIONS.every(o => current.has(o));
                if (allSelected) {
                  FULL_OPTIONS.forEach(o => current.delete(o));
                } else {
                  FULL_OPTIONS.forEach(o => current.add(o));
                }
                set("options", Array.from(current));
              }}
              className="px-4 py-1.5 rounded-xl text-xs font-extrabold border-2 transition-all"
              style={
                ["냉장고","세탁기","에어컨","TV","전자레인지","인터넷","가스레인지","수도"].every(o => form.options.includes(o))
                  ? { background: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--primary))" }
                  : { background: "transparent", color: "hsl(var(--primary))", borderColor: "hsl(var(--primary))" }
              }
            >
              ✨ 풀옵션
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ROOM_OPTIONS.map((opt) => (
              <button key={opt} type="button" onClick={() => toggleOption(opt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  form.options.includes(opt)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:border-primary/50"
                }`}>{opt}</button>
            ))}
          </div>
        </Section>
      )}

      {/* 방 비번 / 건물 비번 — 매매/토지 제외 (상가임대류 포함) */}
      {!isWarehouseSale && !isLand && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground/70">호실 비번</label>
            <input type="text" placeholder="방 비밀번호" value={form.roomPassword} onChange={(e) => set("roomPassword", e.target.value)} className={ic(false)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground/70">건물 비번</label>
            <input type="text" placeholder="건물 비밀번호" value={form.buildingPassword} onChange={(e) => set("buildingPassword", e.target.value)} className={ic(false)} />
          </div>
        </div>
      )}

      {/* 방향 — 매매/상가임대류/토지 제외 */}
      {!isWarehouseSale && !isCommercial && !isLand && (
        <Section label="방향">
          <div className="flex flex-wrap gap-2">
            {DIRECTION_OPTIONS.map((d) => (
              <button key={d} type="button" onClick={() => set("direction", form.direction === d ? "" : d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  form.direction === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:border-primary/50"
                }`}>{d}</button>
            ))}
          </div>
        </Section>
      )}

      {/* 공실 여부 — 매매 타입이더라도 집합건물이면 표시 */}
      {(form.tradeType !== "매매" || isCollective) && !isLand && !isBuildingSale && (
        <Section label="공실여부">
          <div className="flex gap-3">
            {VACANCY_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => set("vacancy", form.vacancy === t ? "공실" : t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  form.vacancy === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:border-primary/50"
                }`}>{t}</button>
            ))}
          </div>

          {/* 단기가능 체크박스 */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl border transition-all"
            style={{
              background: form.options.includes("단기가능") ? "hsl(217 91% 97%)" : "hsl(var(--muted)/0.3)",
              borderColor: form.options.includes("단기가능") ? "hsl(217 91% 65%)" : "hsl(var(--border))",
            }}>
            <label className="flex items-center gap-2 text-sm cursor-pointer w-full"
              style={{ color: form.options.includes("단기가능") ? "hsl(217 91% 40%)" : undefined }}>
              <input type="checkbox"
                checked={form.options.includes("단기가능")}
                onChange={(e) => {
                  const cur = form.options;
                  set("options", e.target.checked ? [...cur, "단기가능"] : cur.filter((o) => o !== "단기가능"));
                }}
                className="w-4 h-4 accent-primary" />
              <span className="font-semibold">단기 가능</span>
              {form.options.includes("단기가능") && (
                <span className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded"
                  style={{ background: "hsl(217 91% 93%)", color: "hsl(217 91% 35%)", border: "1px solid hsl(217 91% 65%)" }}>
                  단기가능
                </span>
              )}
            </label>
          </div>

          {/* 반려동물 가능 여부 */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-foreground/70 flex items-center gap-1"><img src={petIcon} alt="반려동물" className="w-4 h-4 inline" /> 반려동물</p>
            <div className="flex gap-2">
              {(["가능", "불가"] as PetType[]).map((v) => {
                const label = v === "가능" ? "가능" : "불가";
                const isActive = form.pet === v;
                return (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => set("pet", form.pet === v ? "" : v)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all"
                    style={
                      isActive
                        ? v === "가능"
                          ? { background: "hsl(142 71% 45%)", color: "#fff", borderColor: "hsl(142 71% 45%)" }
                          : v === "불가"
                          ? { background: "hsl(0 85% 55%)", color: "#fff", borderColor: "hsl(0 85% 55%)" }
                          : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                        : { background: "hsl(var(--background))", color: "hsl(var(--foreground))", borderColor: "hsl(var(--border))" }
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 세입자 중도퇴거 체크박스 */}
          <div className="flex items-center gap-3 mt-2 px-3 py-2 rounded-xl border transition-all"
            style={{
              background: form.earlyExit ? "hsl(0 85% 97%)" : "hsl(var(--muted)/0.3)",
              borderColor: form.earlyExit ? "hsl(0 85% 70%)" : "hsl(var(--border))",
            }}>
            <label className="flex items-center gap-2 text-sm cursor-pointer w-full" style={{ color: form.earlyExit ? "hsl(0 85% 45%)" : undefined }}>
              <input type="checkbox" checked={form.earlyExit}
                onChange={(e) => set("earlyExit", e.target.checked)} className="w-4 h-4 accent-destructive" />
              <span className={`font-semibold ${form.earlyExit ? "text-[hsl(0_85%_45%)]" : ""}`}>세입자 중도퇴거</span>
              {form.earlyExit && (
                <span className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded"
                  style={{ background: "hsl(0 85% 93%)", color: "hsl(0 85% 45%)", border: "1px solid hsl(0 85% 70%)" }}>
                  중도퇴거
                </span>
              )}
            </label>
          </div>

          {/* 퇴거 예정일 */}
          <div className="flex flex-col gap-1 mt-1">
            <label className="text-xs font-semibold text-muted-foreground">
              퇴거 예정일
              <span className="ml-1 text-[10px] font-normal text-muted-foreground/70">(예: 2025.03.15)</span>
            </label>
            <input
              type="text"
              placeholder="예) 2025-03-15"
              value={form.vacateDate}
              maxLength={10}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
                let formatted = raw;
                if (raw.length > 4) formatted = raw.slice(0, 4) + "-" + raw.slice(4);
                if (raw.length > 6) formatted = raw.slice(0, 4) + "-" + raw.slice(4, 6) + "-" + raw.slice(6);
                set("vacateDate", formatted);
              }}
              className={ic(false)}
              style={form.vacateDate ? { borderColor: "hsl(0 85% 60%)", background: "hsl(0 85% 98%)" } : {}}
            />
            {form.vacateDate && (
              <p className="text-[11px] font-semibold" style={{ color: "hsl(0 85% 45%)" }}>
                🚪 퇴거 예정: {form.vacateDate}
              </p>
            )}
          </div>
        </Section>
      )}

      {/* 금액 입력 */}
      <Section label="금액 입력" error={errors.amount}>
        <p className="text-[11px] text-muted-foreground/70 -mt-1">단위: 만원</p>
        {form.tradeType === "매매" || isBuildingSale ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <AmountInput label="매매가액 *" value={form.salePrice} onChange={(v) => set("salePrice", v)} placeholder="예) 15,000" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* 임대 방식 다중 선택 */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] font-bold text-foreground/70">임대 방식 (중복 선택 가능)</p>
              <div className="flex gap-2">
                {(["월세", "반전세", "전세"] as const).map((mode) => {
                  const isOn = form.rentModes.includes(mode);
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        const cur = form.rentModes;
                        const next = isOn ? cur.filter(m => m !== mode) : [...cur, mode];
                        set("rentModes", next.length === 0 ? ["월세"] : next);
                      }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
                      style={isOn
                        ? { background: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--primary))" }
                        : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                      }
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 월세 금액 */}
            {(form.rentModes.includes("월세") || form.rentModes.length === 0) && (
              <div className="rounded-xl border border-border bg-muted/20 p-3 flex flex-col gap-2">
                <p className="text-[11px] font-extrabold text-primary">💰 월세</p>
                <div className="grid grid-cols-2 gap-2">
                  <AmountInput label="보증금" value={form.deposit} onChange={(v) => set("deposit", v)} />
                  <AmountInput label="월세" value={form.monthlyRent} onChange={(v) => set("monthlyRent", v)} />
                </div>
              </div>
            )}
            {/* 반전세 금액 */}
            {form.rentModes.includes("반전세") && (
              <div className="rounded-xl border border-border bg-muted/20 p-3 flex flex-col gap-2">
                <p className="text-[11px] font-extrabold text-primary">🏠 반전세</p>
                <div className="grid grid-cols-2 gap-2">
                  <AmountInput label="보증금" value={form.halfDeposit} onChange={(v) => set("halfDeposit", v)} />
                  <AmountInput label="월세" value={form.halfMonthly} onChange={(v) => set("halfMonthly", v)} />
                </div>
              </div>
            )}
            {/* 전세 금액 */}
            {form.rentModes.includes("전세") && (
              <div className="rounded-xl border border-border bg-muted/20 p-3 flex flex-col gap-2">
                <p className="text-[11px] font-extrabold text-primary">🏡 전세</p>
                <AmountInput label="보증금" value={form.jeonseDeposit} onChange={(v) => set("jeonseDeposit", v)} />
              </div>
            )}
          </div>
        )}
        {/* 관리비 + 청소비 + 중개보수 — 창고/공장매매 제외 */}
        {!isWarehouseSale && (
          <div className="grid grid-cols-2 gap-3 mt-1">
            {["상가","식당·카페","사무실","공장·창고","병원·학원","지식산업","기타임대","상가주택매매","상가건물매매","구분상가매매","지식산업매매"].includes(form.detailType) && (
              <div className="col-span-2">
                <AmountInput label="권리금" value={form.keyMoney} onChange={(v) => set("keyMoney", v)} placeholder="없으면 0 또는 비워두기" />
              </div>
            )}
            <AmountInput label="관리비" value={form.managementFee} onChange={(v) => set("managementFee", v)} />
            <AmountInput label="퇴실 청소비" value={form.exitCleanFee} onChange={(v) => set("exitCleanFee", v)} />
            <div className="col-span-2">
              <AmountInput label="중개보수" value={form.brokerFee} onChange={(v) => set("brokerFee", v)} placeholder="예) 협의" noUnit />
            </div>
          </div>
        )}
        {/* 창고/공장매매: 중개보수만 표시 */}
        {isWarehouseSale && (
          <div className="grid grid-cols-1 gap-3 mt-1">
            <AmountInput label="중개보수" value={form.brokerFee} onChange={(v) => set("brokerFee", v)} placeholder="예) 협의" noUnit />
          </div>
        )}
      </Section>

      {/* LH 전세대출 — 매매 타입 제외 */}
      {!isWarehouseSale && form.tradeType !== "매매" && !isLand && (
        <Section label="LH (전세대출)">
          <div className="flex gap-5">
            {LH_TYPES.map((t) => (
              <Radio key={t} checked={form.lhType === t} onClick={() => set("lhType", t)}>{t}</Radio>
            ))}
          </div>
        </Section>
      )}


      {/* 메모 */}
      <Section label="메모">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1"><img src={memoIcon} alt="건물메모" className="w-4 h-4 object-contain" style={{ imageRendering: '-webkit-optimize-contrast' as any }} /> 건물 메모</label>
            <textarea rows={2} value={form.buildingMemo} onChange={(e) => set("buildingMemo", e.target.value)}
              className={ic(false) + " resize-none" + (form.buildingMemo?.trim() ? " !border-destructive !ring-destructive/20" : "")} placeholder="건물 관련 메모" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1"><img src={memoIcon} alt="방메모" className="w-4 h-4 object-contain" style={{ imageRendering: '-webkit-optimize-contrast' as any }} /> 방 메모</label>
            <textarea rows={2} value={form.myMemo} onChange={(e) => set("myMemo", e.target.value)}
              className={ic(false) + " resize-none" + (form.myMemo?.trim() ? " !border-destructive !ring-destructive/20" : "")} placeholder="방 관련 메모" />
          </div>
        </div>
      </Section>

      {/* 매물 소개 */}
      <Section label="매물 소개">
        <textarea
          placeholder="매물의 특징, 특이사항 등을 적어주세요."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={300} rows={3}
          className={ic(false) + " resize-none"}
        />
        <p className="text-right text-[11px] text-muted-foreground mt-0.5">{form.description.length} / 300</p>
      </Section>
    </div>
  );
}

/* ─── Step 3 ─── */
function Step3({
  form, set, errors, uploading, fileInputRef, onImageUpload, onImageRemove, onImageSetMain,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onImageUpload: (files: FileList | null) => Promise<void>;
  onImageRemove: (url: string) => void;
  onImageSetMain: (url: string) => void;
}) {
  const [showOwner2, setShowOwner2] = useState(!!form.contactOwner2);
  const contacts: { key: keyof FormState; label: string; placeholder: string; required?: boolean }[] = [
    { key: "contactOwner", label: "소유주 연락처", placeholder: "예) 010-1234-5678" },
    { key: "contactBroker", label: "부동산 연락처", placeholder: "예) 043-123-4567" },
    { key: "contactTenant", label: "세입자 연락처", placeholder: "예) 010-9876-5432" },
    { key: "contactManager", label: "관리인 연락처", placeholder: "예) 010-5555-6666" },
  ];

  return (
    <div className="flex flex-col gap-5">

      {/* 매물 사진 */}
      <Section label="매물 사진">
        {form.images.length > 0 && (
          <ImagePreviewCarousel images={form.images} onRemove={onImageRemove} onSetMain={onImageSetMain} />
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">업로드 중...</span></>
          ) : (
            <><ImagePlus className="w-4 h-4" /><span className="text-sm font-medium">사진 추가 {form.images.length > 0 ? `(${form.images.length}장)` : "(여러 장 가능)"}</span></>
          )}
        </button>
        <p className="text-[11px] text-muted-foreground/60 -mt-1">첫 번째 사진이 대표 이미지로 설정됩니다</p>
      </Section>

      {/* 연락처 */}
      <Section label="연락처">
        <div className="flex flex-col gap-3">
          {/* 소유주 연락처 1 + 추가 버튼 */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-foreground/70">소유주 연락처</label>
              {!showOwner2 && (
                <button type="button" onClick={() => setShowOwner2(true)}
                  className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5">
                  <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-black">+</span>
                  추가
                </button>
              )}
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="tel" placeholder="예) 010-1234-5678"
                value={form.contactOwner as string}
                onChange={(e) => set("contactOwner", formatPhone(e.target.value))}
                className={ic(!!(errors.contactOwner)) + " pl-9"} />
            </div>
          </div>
          {/* 소유주 연락처 2 */}
          {showOwner2 && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-foreground/70">소유주 연락처 2</label>
                <button type="button" onClick={() => { setShowOwner2(false); set("contactOwner2", ""); }}
                  className="text-[10px] font-bold text-destructive hover:text-destructive/80 transition-colors">삭제</button>
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="tel" placeholder="예) 010-5678-1234"
                  value={form.contactOwner2 as string}
                  onChange={(e) => set("contactOwner2", formatPhone(e.target.value))}
                  className={ic(false) + " pl-9"} />
              </div>
            </div>
          )}
          {/* 나머지 연락처 */}
          {contacts.filter(c => c.key !== "contactOwner").map(({ key, label, placeholder, required }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground/70">
                {label} {required && <span className="text-destructive">*</span>}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel" placeholder={placeholder}
                  value={form[key] as string}
                  onChange={(e) => set(key, formatPhone(e.target.value))}
                  className={ic(!!(errors[key])) + " pl-9"}
                />
              </div>
              {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
            </div>
          ))}
        </div>
      </Section>

      {/* 노출 설정 */}
      <Section label="노출 설정">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
            <div>
              <p className="text-sm font-semibold text-foreground">매물 노출</p>
              <p className="text-xs text-muted-foreground">플랫폼에 매물을 공개합니다</p>
            </div>
            <OnOffToggle checked={form.expose} onClick={() => set("expose", !form.expose)} />
          </div>
        </div>
      </Section>
    </div>
  );
}

/* ─── Image Preview Carousel ─── */
function ImagePreviewCarousel({
  images,
  onRemove,
  onSetMain,
}: {
  images: string[];
  onRemove: (url: string) => void;
  onSetMain?: (url: string) => void;
}) {
  const [idx, setIdx] = useState(0);
  const safeIdx = Math.min(idx, images.length - 1);

  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  const handleRemove = (url: string) => {
    const newLen = images.length - 1;
    if (safeIdx >= newLen && newLen > 0) setIdx(newLen - 1);
    onRemove(url);
  };

  const isMain = safeIdx === 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full rounded-xl overflow-hidden bg-muted border border-border" style={{ height: 200 }}>
        {/* 슬라이드 */}
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${safeIdx * 100}%)`, width: `${images.length * 100}%` }}
        >
          {images.map((src, i) => (
            <div key={src} className="h-full flex-shrink-0 relative" style={{ width: `${100 / images.length}%` }}>
              <img src={src} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* 삭제 버튼 */}
        <button
          type="button"
          onClick={() => handleRemove(images[safeIdx])}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-destructive flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>

        {/* 대표 뱃지 or 대표 설정 버튼 */}
        {isMain ? (
          <span className="absolute top-2 left-2 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">⭐ 대표</span>
        ) : (
          onSetMain && (
            <button
              type="button"
              onClick={() => { onSetMain(images[safeIdx]); setIdx(0); }}
              className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors"
              style={{ background: "rgba(0,0,0,0.55)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}
            >
              대표로 설정
            </button>
          )
        )}

        {/* 이전/다음 버튼 */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </>
        )}

        {/* 인디케이터 + 장수 */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center gap-1">
            <div className="flex gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ background: i === safeIdx ? "#fff" : "rgba(255,255,255,0.45)" }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 장수 카운터 */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-3 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
            {safeIdx + 1} / {images.length}
          </div>
        )}
      </div>

      {/* 썸네일 스트립 */}
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {images.map((src, i) => (
            <div
              key={src}
              className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all"
              style={{ borderColor: i === safeIdx ? "hsl(var(--primary))" : "transparent" }}
            >
              <button
                type="button"
                onClick={() => setIdx(i)}
                className="w-full h-full"
              >
                <img src={src} alt="" className="w-full h-full object-cover pointer-events-none" />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 text-center text-[7px] font-bold bg-primary/80 text-white leading-4">대표</span>
                )}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemove(src); }}
                className="absolute top-0 right-0 w-4 h-4 rounded-bl-md bg-black/70 hover:bg-destructive flex items-center justify-center z-10"
                title="사진 삭제"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Success ─── */
function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 gap-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <span className="text-3xl">🎉</span>
      </div>
      <h3 className="text-lg font-extrabold text-foreground">등록 완료!</h3>
      <p className="text-sm text-muted-foreground text-center">
        매물이 즉시 등록되었습니다.<br />매물 목록에서 확인하세요.
      </p>
      <button onClick={onClose} className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
        확인
      </button>
    </div>
  );
}

/* ─── Shared UI Helpers ─── */
const ic = (hasError: boolean) =>
  `w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all bg-background text-foreground placeholder:text-muted-foreground ${
    hasError
      ? "border-destructive focus:ring-2 focus:ring-destructive/20"
      : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
  }`;

function Section({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-sm font-bold text-foreground">{label}</p>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Radio({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none" onClick={onClick}>
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? "border-primary" : "border-muted-foreground/40"}`}>
        {checked && <span className="w-2 h-2 rounded-full bg-primary" />}
      </span>
      <span className={`text-sm ${checked ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{children}</span>
    </label>
  );
}

function OnOffToggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
        checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}>
      {checked ? "ON" : "OFF"}
    </button>
  );
}

function Select({
  value, onChange, placeholder, options, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all appearance-none bg-background text-foreground border-border focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-40 disabled:cursor-not-allowed pr-8"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

function AmountInput({
  label, value, onChange, placeholder = "만원", noUnit = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  noUnit?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-foreground/70">{label}</label>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={ic(false) + (noUnit ? "" : " pr-10")}
        />
        {!noUnit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">만원</span>
        )}
      </div>
    </div>
  );
}

