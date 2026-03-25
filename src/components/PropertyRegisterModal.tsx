import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { X, Building2, Phone, MapPin, ChevronDown, ImagePlus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/* ─── Address Data ─── */
const CHEONGJU_SIGUNGU = [
  "청주시 상당구","청주시 서원구","청주시 흥덕구","청주시 청원구",
];

const DONG_MAP: Record<string, string[]> = {
  "청주시 상당구": [
    // 읍면
    "낭성면","미원면","가덕면","남일면","문의면",
    // 동
    "북문로1가","북문로2가","북문로3가",
    "남문로1가","남문로2가",
    "서문동","문화동","수동","영동","석교동","남주동",
    "탑동","대성동","영운동","금천동",
    "용담동","명암동","산성동",
    "용암동","용정동","방서동","평촌동","지북동","운동동","월오동",
    "중앙동",
  ],
  "청주시 서원구": [
    // 읍면
    "남이면","현도면",
    // 동
    "사직동","사창동","모충동","수곡동",
    "성화동","죽림동","개신동","분평동","산남동",
    "미평동","장성동","장암동",
  ],
  "청주시 흥덕구": [
    // 읍면
    "오송읍","강내면","옥산면",
    // 동
    "운천동","신봉동","복대동","가경동",
    "봉명동","송정동",
    // 강서제1동 법정동
    "강서동","동막동","비하동","서촌동","석곡동","석소동",
    "수의동","신전동","신촌동","정봉동","지동동","현암동","휴암동",
    // 강서제2동 법정동
    "남촌동","내곡동","문암동","상신동","송절동",
    "신대동","신성동","외북동","원평동","평동","향정동","화계동",
  ],
  "청주시 청원구": [
    // 읍면
    "내수읍","오창읍","북이면",
    // 동
    "우암동","내덕동","율량동","사천동",
    "오근장동","오동동","외남동","외평동","외하동",
    "정북동","정상동","정하동","주성동","주중동",
  ],
};

/* ─── Constants ─── */
const BROKER_TYPES = ["일반중개","공동중개"] as const;
const TRADE_TYPES = ["임대","매매"] as const;
const BUILDING_TYPES = ["단독건물","집합건물","토지"] as const;

// 집합건물로 취급할 세부 유형 (호수별 연락처 저장/조회)
const COLLECTIVE_DETAIL_TYPES = ["아파트","오피스텔","빌라","연립","다세대","주상복합"] as const;
const PROPERTY_TYPE_GROUPS_REG = [
  { group: "주거형 임대", types: ["원룸","투베이","투룸","쓰리룸","포룸","주인세대","고시원","다가구","단독주택","아파트","오피스텔","빌라","연립","다세대","주상복합"] },
  { group: "상가 임대", types: ["상가","사무실","공장·창고","식당·카페","병원·학원"] },
  { group: "주거형 외 임대·매매", types: ["상가임대","기타임대","단독매매","다가구매매","다중매매","상가주택매매","상가건물매매","구분상가매매","창고/공장매매"] },
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
const FACILITY_OPTIONS = ["수도","유선TV","인터넷","CCTV"] as const;
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

interface FormState {
  brokerType: BrokerType;
  tradeType: TradeType;
  buildingType: BuildingType;
  detailType: DetailType;
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
  contactTenant: string;
  contactManager: string;
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
  contactBroker: "", contactOwner: "", contactTenant: "", contactManager: "",
  tenantOccupied: false, tenantDeposit: "", tenantMonthly: "", vacateDate: "",
  earlyExit: false,
  expose: true, allowAddressView: false,
  images: [],
  elevator: false, isNew: false, isHot: false, buildingMemo: "",
  buildingDong: "",
};

const STEP_LABELS = ["기본 설정 및 주소", "옵션 및 조건", "연락처 및 사진"];

interface Props { onClose: () => void; }

export default function PropertyRegisterModal({ onClose }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
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

  // ── 주소(동+번지) 변경 시 전화번호 자동 로드 (단독건물: 동+번지 기준) ──────
  useEffect(() => {
    if (!form.dong || isCollectiveBuilding) return;
    const run = async () => {
      let q = supabase
        .from("cheongju_contacts")
        .select("contact_owner,contact_manager,contact_broker,phone")
        .eq("dong", form.dong)
        .is("unit_number", null);
      if (form.lotNumber) q = q.eq("lot_number", form.lotNumber);
      const { data } = await q.maybeSingle();
      if (!data) return;
      setForm((prev) => ({
        ...prev,
        contactOwner: prev.contactOwner || data.contact_owner || data.phone || "",
        contactManager: prev.contactManager || data.contact_manager || "",
        contactBroker: prev.contactBroker || data.contact_broker || "",
      }));
    };
    run();
  }, [form.dong, form.lotNumber, form.buildingType, form.detailType]);

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

      // 2순위: 이전 매물에서 이미지·비밀번호 자동 로드
      const { data: propData } = await supabase
        .from("properties")
        .select("images,building_password,room_password")
        .eq("dong", form.dong)
        .eq("unit_number", form.unitNo)
        .order("registered_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!propData) return;
      setForm((prev) => ({
        ...prev,
        images: prev.images.length > 0 ? prev.images : (propData.images ?? []),
        buildingPassword: prev.buildingPassword || propData.building_password || "",
        roomPassword: prev.roomPassword || propData.room_password || "",
      }));
    };
    run();
  }, [form.dong, form.unitNo, form.buildingType, form.detailType, form.lotNumber]);

  // ── 단독건물: 호수 입력 시 이전 매물 이미지·비밀번호만 자동 로드 ──────────
  useEffect(() => {
    if (!form.dong || !form.unitNo || isCollectiveBuilding) return;
    const run = async () => {
      const { data } = await supabase
        .from("properties")
        .select("images,building_password,room_password")
        .eq("dong", form.dong)
        .eq("unit_number", form.unitNo)
        .eq("status", "active")
        .order("registered_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) return;
      setForm((prev) => ({
        ...prev,
        images: prev.images.length > 0 ? prev.images : (data.images ?? []),
        buildingPassword: prev.buildingPassword || data.building_password || "",
        roomPassword: prev.roomPassword || data.room_password || "",
      }));
    };
    run();
  }, [form.dong, form.unitNo, form.buildingType, form.detailType]);

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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    const isSale = form.detailType === "건물매매" || form.tradeType === "매매";
    const isLand = form.detailType === "토지" || form.buildingType === "토지";
    const isCommercial = ["상가","사무실","공장·창고"].includes(form.detailType);
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

    const address = ["충북", form.sigungu, form.dong, form.lotNumber].filter(Boolean).join(" ");
    const districtVal = form.sigungu ? form.sigungu.replace("청주시 ", "") : null;

    // ── Geocoding: 주소 → 좌표 ─────────────────────────────────
    let lat = 0;
    let lng = 0;
    try {
      const geoAddress = ["충북 청주시", form.sigungu.replace("청주시 ", ""), form.dong, form.lotNumber].filter(Boolean).join(" ");
      const { data: geoData, error: geoErr } = await supabase.functions.invoke("geocode", {
        body: { address: geoAddress },
      });
      if (!geoErr && geoData?.success) {
        lat = geoData.lat;
        lng = geoData.lng;
      } else {
        console.warn("[geocode] 좌표 변환 실패:", geoErr?.message ?? geoData?.error);
      }
    } catch (e) {
      console.warn("[geocode] 예외:", e);
    }

    const contactParts = [
      form.contactOwner && `건물주:${form.contactOwner}`,
      form.contactBroker && `부동산:${form.contactBroker}`,
      form.contactTenant && `세입자:${form.contactTenant}`,
      form.contactManager && `관리인:${form.contactManager}`,
    ].filter(Boolean).join("|");

    const isBuildingSale = ["건물매매","단독매매","창고/공장매매","구분상가매매","상가주택매매","상가건물매매","다가구매매","다중매매"].includes(form.detailType);
    const isCommercialLease = ["상가","사무실","공장·창고"].includes(form.detailType);

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
      dong: form.dong,
      lot_number: form.lotNumber,
      district: districtVal,
      type: (form.detailType === "토지" || form.buildingType === "토지")
        ? "토지"
        : form.detailType || (form.brokerType === "공동중개" ? "공동중개" : form.tradeType),
      room_type: isBuildingSale ? form.buildingSaleType : (form.detailType || null),
      unit_number: form.unitNo || null,
      area: isBuildingSale
        ? [form.landArea && `대지 ${form.landArea}`, form.buildingArea && `건평 ${form.buildingArea}`].filter(Boolean).join(" / ")
        : form.area,
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
      is_new: form.isNew,
      is_hot: form.isHot,
      elevator: form.elevator,
      status: "active" as const,
      registered_date: new Date().toISOString().split("T")[0],
      agent_name: myAgentName || contactParts,
      registered_by: user?.userId ?? null,
      note: [
        form.contactOwner && `건물주: ${form.contactOwner}`,
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
        ...rentNotes,
        form.direction && `방향: ${form.direction}`,
        form.lhType && form.lhType !== "관계없음" && `LH: ${form.lhType}`,
        form.exitCleanFee && `청소비: ${form.exitCleanFee}`,
        form.brokerFee && `중개보수: ${form.brokerFee}`,
      ].filter(Boolean).join("\n") || null,
      vacate_date: form.vacateDate || null,
    };

    const { error } = await supabase.from("properties").insert(payload);
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

    setSubmitted(true);
  };

  const goNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) handleSubmit();
  };

  const goPrev = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
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
          <div className="overflow-y-auto flex-1 px-6 py-4">
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
  const sigunguList = CHEONGJU_SIGUNGU;
  const dongList = DONG_MAP[form.sigungu] ?? [];
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
        <Section label="세부 종류" error={errors.detailType}>
          {PROPERTY_TYPE_GROUPS_REG.map(({ group, types }) => (
            <div key={group} className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{group}</span>
              <div className="flex flex-wrap gap-1.5">
                {types.map((t) => (
                  <button key={t} type="button" onClick={() => set("detailType", t)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                    style={form.detailType === t
                      ? { background: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--primary))" }
                      : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Section>
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
            <input type="text" placeholder="번지 입력 (예: 123-4)" value={form.lotNumber} onChange={(e) => set("lotNumber", e.target.value)} className={ic(false) + " pl-9"} />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">번지</span>
        </div>
        <p className="text-[11px] text-muted-foreground/60 -mt-1">도로명주소 불가 / 번지주소만 가능 · 번지 입력 시 등록된 연락처가 자동으로 불러와집니다 ✨</p>
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
            <label className="text-xs font-semibold text-foreground/70">평수</label>
            <input type="text" placeholder="예) 15평" value={form.area} onChange={(e) => set("area", e.target.value)} className={ic(false)} />
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
  const isCommercial = ["상가","식당·카페","사무실","공장·창고","병원·학원"].includes(form.detailType);
  // 상가 임대류 및 토지: 반려동물·옵션·부가시설 숨김
  const hideResidentialOptions = isLand || isBuildingSale || isCommercial;
  const showRoomOptions = !hideResidentialOptions;
  const showFacilities = !isLand && !isBuildingSale;
  // 토지 임대: 방향도 숨김
  const showDirection = !isLand && !isBuildingSale;

  const toggleFacility = (f: string) => {
    const cur = form.facilities;
    set("facilities", cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 요약 칩 */}
      <div className="flex gap-1.5 flex-wrap">
        {[form.brokerType, form.tradeType, form.buildingType, form.detailType].filter(Boolean).map((v) => (
          <span key={v} className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">{v}</span>
        ))}
      </div>

      {/* 부가 시설 - 토지/건물매매/상가임대류 제외 */}
      {showFacilities && (
        <Section label="부가 시설">
          <div className="flex flex-wrap gap-2">
            {FACILITY_OPTIONS.map((f) => {
              const active = form.facilities.includes(f);
              const icon = f === "수도" ? "💧" : f === "유선TV" ? "📺" : f === "인터넷" ? "🌐" : "📷";
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFacility(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    active
                      ? "bg-primary/10 text-primary border-primary"
                      : "bg-background text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  <span>{icon}</span>{f}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* 옵션 - 토지/건물매매/상가임대류 제외 */}
      {showRoomOptions && (
        <Section label="옵션">
          {/* 풀옵션 체크 버튼 */}
          <FullOptionToggle options={form.options} set={set} />
          <div className="flex flex-wrap gap-2">
            {ROOM_OPTIONS.map((opt) => (
              <button key={opt} type="button" onClick={() => toggleOption(opt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  form.options.includes(opt)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:border-primary/50"
                }`}>
                {opt}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* 비밀번호 - 토지/건물매매/상가임대류 제외 */}
      {showRoomOptions && (
        <Section label="비밀번호">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground/70">건물 비번</label>
              <input type="text" placeholder="건물 공동현관 비번" value={form.buildingPassword} onChange={(e) => set("buildingPassword", e.target.value)} className={ic(false)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground/70">호실 비번</label>
              <input type="text" placeholder="방 도어락 비번" value={form.roomPassword} onChange={(e) => set("roomPassword", e.target.value)} className={ic(false)} />
            </div>
          </div>
        </Section>
      )}

      {/* 방향 - 토지/건물매매/상가임대류 제외 */}
      {showDirection && (
        <Section label="방향">
          <div className="flex flex-wrap gap-2">
            {DIRECTION_OPTIONS.map((d) => (
              <button key={d} type="button" onClick={() => set("direction", form.direction === d ? "" : d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  form.direction === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:border-primary/50"
                }`}>
                {d}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* 공실 여부 - 토지/매매/건물매매 제외 */}
      {!isLand && !isBuildingSale && form.tradeType !== "매매" && (
        <Section label="공실 여부">
          <div className="flex gap-3">
            {VACANCY_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => set("vacancy", t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  form.vacancy === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:border-primary/50"
                }`}>
                {t}
              </button>
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

          {/* 세입자 중도퇴거 */}
          <div className="flex items-center gap-3 mt-2 px-3 py-2.5 rounded-xl border transition-all"
            style={{
              background: form.earlyExit ? "hsl(0 85% 97%)" : "hsl(var(--muted)/0.3)",
              borderColor: form.earlyExit ? "hsl(0 85% 70%)" : "hsl(var(--border))",
            }}>
            <label className="flex items-center gap-2 text-sm cursor-pointer w-full">
              <input
                type="checkbox"
                checked={form.earlyExit}
                onChange={(e) => set("earlyExit", e.target.checked)}
                className="w-4 h-4 accent-destructive"
              />
              <span className="font-semibold" style={{ color: form.earlyExit ? "hsl(0 85% 45%)" : undefined }}>
                세입자 중도퇴거
              </span>
              {form.earlyExit && (
                <span className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded"
                  style={{ background: "hsl(0 85% 93%)", color: "hsl(0 85% 45%)", border: "1px solid hsl(0 85% 70%)" }}>
                  중도퇴거
                </span>
              )}
            </label>
          </div>

          {/* 퇴거 예정일 — 항상 표시 */}
          <div className="flex flex-col gap-1 mt-1">
            <label className="text-xs font-semibold text-muted-foreground">
              퇴거 예정일
              <span className="ml-1 text-[10px] font-normal text-muted-foreground/70">(예: 2025.03.15)</span>
            </label>
            <input
              type="text"
              placeholder="예) 2025.03.15"
              value={form.vacateDate}
              onChange={(e) => set("vacateDate", e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all bg-background text-foreground placeholder:text-muted-foreground border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
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

      {/* 아파트 매매: 세입자 거주 여부 */}
      {form.detailType === "아파트" && form.tradeType === "매매" && (
        <Section label="세입자 거주 여부">
          <div className="flex gap-3 mb-1">
            <button type="button" onClick={() => set("tenantOccupied", false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                !form.tenantOccupied ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/50"
              }`}>
              공실 (세입자 없음)
            </button>
            <button type="button" onClick={() => set("tenantOccupied", true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                form.tenantOccupied ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/50"
              }`}>
              세입자 거주중
            </button>
          </div>
          {form.tenantOccupied && (
            <div className="flex flex-col gap-3 p-3 rounded-xl border border-border bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground">세입자 계약 조건</p>
              <div className="grid grid-cols-2 gap-3">
                <AmountInput label="전세금 / 보증금" value={form.tenantDeposit} onChange={(v) => set("tenantDeposit", v)} placeholder="예) 20,000" />
                <AmountInput label="월세 (없으면 0)" value={form.tenantMonthly} onChange={(v) => set("tenantMonthly", v)} placeholder="예) 0" />
              </div>
              {/* 퇴거일 날짜 선택 */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground/70">퇴거일</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className={cn(
                      "flex items-center gap-2 w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all bg-background text-foreground border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-left",
                      !form.vacateDate && "text-muted-foreground"
                    )}>
                      <CalendarIcon className="w-4 h-4 opacity-50 flex-shrink-0" />
                      {form.vacateDate ? form.vacateDate : "날짜 선택"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[10300]" align="start">
                    <Calendar
                      mode="single"
                      selected={form.vacateDate ? new Date(form.vacateDate) : undefined}
                      onSelect={(d) => set("vacateDate", d ? format(d, "yyyy-MM-dd") : "")}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* 아파트 외 매매 퇴거일 - 토지/건물매매 제외 */}
      {form.tradeType === "매매" && form.detailType !== "아파트" && !isLand && !isBuildingSale && (
        <Section label="퇴거일">
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className={cn(
                "flex items-center gap-2 w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all bg-background text-foreground border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-left",
                !form.vacateDate && "text-muted-foreground"
              )}>
                <CalendarIcon className="w-4 h-4 opacity-50 flex-shrink-0" />
                {form.vacateDate ? form.vacateDate : "날짜 선택 (없으면 생략)"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[10300]" align="start">
              <Calendar
                mode="single"
                selected={form.vacateDate ? new Date(form.vacateDate) : undefined}
                onSelect={(d) => set("vacateDate", d ? format(d, "yyyy-MM-dd") : "")}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </Section>
      )}

      {/* 금액 입력 */}
      <Section label="금액 입력" error={errors.amount}>
        <p className="text-[11px] text-muted-foreground/70 -mt-1">단위: 만원</p>
        <div className="grid grid-cols-2 gap-3">
          {/* 건물매매 선택 시 전용 레이아웃 */}
          {isBuildingSale ? (
            <div className="col-span-2 flex flex-col gap-1 p-3 rounded-xl border border-primary/20 bg-primary/5">
              <p className="text-xs font-bold text-primary mb-1">건물매매 금액</p>
              <AmountInput label="매매가 *" value={form.salePrice} onChange={(v) => set("salePrice", v)} placeholder="예) 150,000" />
            </div>
          ) : form.tradeType === "매매" ? (
            <div className="col-span-2">
              <AmountInput label="매매가액 *" value={form.salePrice} onChange={(v) => set("salePrice", v)} placeholder="예) 15,000" />
            </div>
          ) : (
            /* 임대: 월세/반전세/전세 복수 선택 + 각각 금액 입력 */
            <div className="col-span-2 flex flex-col gap-3">
              {/* 임대 방식 선택 (복수 가능) */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-foreground/70">임대 방식 (복수 선택 가능)</p>
                <div className="flex gap-2">
                  {(["월세", "반전세", "전세"] as const).map((mode) => {
                    const active = form.rentModes.includes(mode);
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          const cur = form.rentModes;
                          const next = active
                            ? cur.filter((m) => m !== mode)
                            : [...cur, mode];
                          set("rentModes", next.length === 0 ? ["월세"] : next);
                        }}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 월세 입력 */}
              {form.rentModes.includes("월세") && (
                <div className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-muted/20">
                  <p className="text-xs font-bold text-foreground">💰 월세 금액</p>
                  <div className="grid grid-cols-2 gap-2">
                    <AmountInput label="보증금" value={form.deposit} onChange={(v) => set("deposit", v)} />
                    <AmountInput label="월세" value={form.monthlyRent} onChange={(v) => set("monthlyRent", v)} />
                  </div>
                </div>
              )}

              {/* 반전세 입력 */}
              {form.rentModes.includes("반전세") && (
                <div className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-muted/20">
                  <p className="text-xs font-bold text-foreground">🏠 반전세 금액</p>
                  <div className="grid grid-cols-2 gap-2">
                    <AmountInput label="보증금" value={form.halfDeposit} onChange={(v) => set("halfDeposit", v)} />
                    <AmountInput label="월세" value={form.halfMonthly} onChange={(v) => set("halfMonthly", v)} />
                  </div>
                </div>
              )}

              {/* 전세 입력 */}
              {form.rentModes.includes("전세") && (
                <div className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-muted/20">
                  <p className="text-xs font-bold text-foreground">🏡 전세 금액</p>
                  <AmountInput label="전세 보증금" value={form.jeonseDeposit} onChange={(v) => set("jeonseDeposit", v)} placeholder="예) 15,000" />
                </div>
              )}
            </div>
          )}
          {/* 상가 유형 시 권리금 */}
          {isCommercial && (
            <div className="col-span-2">
              <AmountInput label="권리금" value={form.keyMoney} onChange={(v) => set("keyMoney", v)} placeholder="없으면 0 또는 비워두기" />
            </div>
          )}
          {/* 관리비·퇴실청소비 - 매매/토지/건물매매 제외 */}
          {!isBuildingSale && !isLand && form.tradeType !== "매매" && (
            <>
              <AmountInput label="관리비" value={form.managementFee} onChange={(v) => set("managementFee", v)} />
              <AmountInput label="퇴실 청소비" value={form.exitCleanFee} onChange={(v) => set("exitCleanFee", v)} />
            </>
          )}
          <div className="col-span-2">
            <AmountInput label="중개보수" value={form.brokerFee} onChange={(v) => set("brokerFee", v)} placeholder="예) 협의" noUnit />
          </div>
        </div>
      </Section>

      {/* LH 전세대출 - 매매/토지/건물매매 제외 */}
      {!isLand && !isBuildingSale && form.tradeType !== "매매" && (
        <Section label="LH (전세대출)">
          <div className="flex gap-3">
            {LH_TYPES.map((t) => (
              <Radio key={t} checked={form.lhType === t} onClick={() => set("lhType", t)}>{t}</Radio>
            ))}
          </div>
        </Section>
      )}

      {/* 체크박스 옵션 */}
      <div className="flex gap-6 flex-wrap">
        {[
          { key: "elevator" as const, label: "엘리베이터" },
          { key: "isNew" as const, label: "신규 매물" },
          { key: "isHot" as const, label: "인기 매물" },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox"
              checked={form[key] as boolean}
              onChange={(e) => set(key, e.target.checked)}
              className="w-4 h-4 accent-primary" />
            {label}
          </label>
        ))}
      </div>

      {/* 메모 */}
      <Section label="메모">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground/70">건물 메모</label>
            <textarea rows={2} value={form.buildingMemo} onChange={(e) => set("buildingMemo", e.target.value)}
              className={ic(false) + " resize-none"} placeholder="건물 관련 메모" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground/70">방 메모 (내 메모)</label>
            <textarea rows={2} value={form.myMemo} onChange={(e) => set("myMemo", e.target.value)}
              className={ic(false) + " resize-none"} placeholder="관리용 메모 (외부 비노출)" />
          </div>
        </div>
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
  const contacts: { key: keyof FormState; label: string; placeholder: string; required?: boolean }[] = [
    { key: "contactOwner", label: "소유주 연락처", placeholder: "예) 010-1234-5678" },
    { key: "contactBroker", label: "부동산 연락처", placeholder: "예) 043-123-4567" },
    { key: "contactTenant", label: "세입자 연락처", placeholder: "예) 010-9876-5432" },
    { key: "contactManager", label: "관리인 연락처", placeholder: "예) 010-5555-6666" },
  ];
  // 입주가능/담당중개사는 표시하지 않음

  return (
    <div className="flex flex-col gap-5">
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

      {/* 매물 사진 */}
      <Section label="매물 사진">
        {/* 캐러셀 미리보기 */}
        {form.images.length > 0 && (
          <ImagePreviewCarousel images={form.images} onRemove={onImageRemove} onSetMain={onImageSetMain} />
        )}
        {/* 업로드 버튼 */}
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
          {contacts.map(({ key, label, placeholder, required }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground/70">
                {label} {required && <span className="text-destructive">*</span>}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel" placeholder={placeholder}
                  value={form[key] as string}
                  onChange={(e) => set(key, e.target.value)}
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
            <button
              key={src}
              type="button"
              onClick={() => setIdx(i)}
              className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all"
              style={{ borderColor: i === safeIdx ? "hsl(var(--primary))" : "transparent" }}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 text-center text-[7px] font-bold bg-primary/80 text-white leading-4">대표</span>
              )}
            </button>
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

/* ─── FullOptionToggle ─── */
const FULL_OPTIONS = [
  "냉장고","세탁기","에어컨","전자레인지","TV","가스레인지","인덕션","침대","책상","옷장","전자키",
];

function FullOptionToggle({
  options,
  set,
}: {
  options: string[];
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const isFullOption = FULL_OPTIONS.every((o) => options.includes(o));

  const toggleFull = () => {
    if (isFullOption) {
      // 풀옵션 해제 → 풀옵션 항목만 제거
      set("options", options.filter((o) => !FULL_OPTIONS.includes(o)));
    } else {
      // 풀옵션 선택 → 기존 옵션 + 풀옵션 합산
      const merged = Array.from(new Set([...options, ...FULL_OPTIONS]));
      set("options", merged);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFull}
      className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border-2 text-sm font-extrabold transition-all mb-2 ${
        isFullOption
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-primary/5 text-primary border-primary/40 hover:border-primary hover:bg-primary/10"
      }`}
    >
      <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        isFullOption ? "bg-white/30 border-white/50" : "bg-white border-primary/40"
      }`}>
        {isFullOption && <span className="text-white text-xs font-black">✓</span>}
      </span>
      풀옵션 (냉장고·세탁기·에어컨·전자레인지·TV 등 {FULL_OPTIONS.length}종 일괄 선택)
    </button>
  );
}
