import { useMemo } from "react";
import { MapProperty } from "@/data/mapProperties";
import { FilterState } from "@/components/MapFilterBar";

// 문자열에서 만원 단위 숫자 파싱 (예: "1억 2,000만원" → 12000, "75만원" → 75)
function parseAmountToManwon(str: string): number | null {
  if (!str || str === "-") return null;
  const s = str.replace(/,|\s/g, "");
  let total = 0;
  const uk = s.match(/(\d+(?:\.\d+)?)억/);
  if (uk) total += parseFloat(uk[1]) * 10000;
  const mk = s.match(/(\d+(?:\.\d+)?)만/);
  if (mk) total += parseFloat(mk[1]);
  if (total === 0) {
    const plain = parseFloat(s.replace(/[^0-9.]/g, ""));
    if (!isNaN(plain)) return plain;
    return null;
  }
  return total;
}

// 층수 파싱 (예: "3층" → 3, "지하1층" → -1)
function parseFloor(str: string): number | null {
  if (!str) return null;
  const basement = str.match(/지하\s*(\d+)/);
  if (basement) return -parseInt(basement[1]);
  const floor = str.match(/(\d+)/);
  if (floor) return parseInt(floor[1]);
  return null;
}

// 면적 파싱 (예: "20㎡ (6평)" → 6, "15평" → 15)
function parseAreaToPyeong(str: string): number | null {
  if (!str) return null;
  // 괄호 안 평수 우선 (예: "20㎡ (6평)")
  const inParen = str.match(/\((\d+(?:\.\d+)?)평\)/);
  if (inParen) return parseFloat(inParen[1]);
  // "15평" 형태
  const pyeong = str.match(/(\d+(?:\.\d+)?)평/);
  if (pyeong) return parseFloat(pyeong[1]);
  // ㎡ → 평 변환 (1평 ≈ 3.30579㎡)
  const sqm = str.match(/(\d+(?:\.\d+)?)㎡/);
  if (sqm) return parseFloat(sqm[1]) / 3.30579;
  return null;
}

// 준공년도 파싱
function parseBuildYear(str: string): number | null {
  if (!str) return null;
  const m = str.match(/(\d{4})/);
  return m ? parseInt(m[1]) : null;
}

// 준공년도 필터 체크 (현재 년도 기준)
function matchBuildYear(buildYearStr: string, filterYears: string[]): boolean {
  if (filterYears.length === 0) return true;
  const year = parseBuildYear(buildYearStr);
  if (year === null) return true;
  const now = new Date().getFullYear();
  const age = now - year;
  return filterYears.some((f) => {
    switch (f) {
      case "1년 이내": return age <= 1;
      case "3년 이내": return age <= 3;
      case "5년 이내": return age <= 5;
      case "10년 이내": return age <= 10;
      case "15년 이내": return age <= 15;
      case "20년 이상": return age >= 20;
      default: return true;
    }
  });
}

export function usePropertyFilter(
  properties: MapProperty[],
  filters: FilterState,
  activeTypes: string[],
  query: string,
  propertyId: string
): MapProperty[] {
  return useMemo(() => {
    return properties.filter((p) => {
      // 유형 필터
      if (!activeTypes.includes("전체") && activeTypes.length > 0) {
        if (!activeTypes.includes(p.type) && !activeTypes.includes(p.roomType ?? "")) return false;
      }

      // 매물번호 검색
      if (propertyId && !String(p.id).includes(propertyId)) return false;

      // 텍스트 검색
      if (query) {
        const q = query.toLowerCase().trim();
        // "율량동 1994" → dong + lotNumber 분리 시도
        const spaceIdx = q.lastIndexOf(" ");
        const qDong = spaceIdx > 0 ? q.slice(0, spaceIdx) : q;
        const qLot = spaceIdx > 0 ? q.slice(spaceIdx + 1) : "";
        const dongLotMatch = qLot !== "" &&
          (p.dong ?? "").toLowerCase().includes(qDong) &&
          (p.lotNumber ?? "").toLowerCase().includes(qLot);
        const matchText =
          p.address.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          (p.buildingName ?? "").toLowerCase().includes(q) ||
          (p.dong ?? "").toLowerCase().includes(q) ||
          ((p.dong ?? "") + " " + (p.lotNumber ?? "")).toLowerCase().includes(q) ||
          dongLotMatch;
        if (!matchText) return false;
      }

      // 거래 유형 (월세/전세/단기임대/임대/매매)
      if (filters.dealType.length > 0) {
        const isJeonse = !p.monthly || p.monthly === "-" || p.monthly === "전세";
        const isWolse = p.monthly && p.monthly !== "-" && p.monthly !== "전세";
        const match = filters.dealType.some((dt) => {
          if (dt === "월세") return isWolse;
          if (dt === "전세") return isJeonse;
          if (dt === "단기임대") return (p.availableFrom ?? "").includes("단기");
          if (dt === "임대") return true; // 상가임대 페이지: 임대=전체 포함
          if (dt === "매매") return false; // 상가임대에서 매매는 별도
          return true;
        });
        if (!match) return false;
      }

      // 보증금 범위
      const [dMin, dMax] = filters.depositRange;
      if (dMin !== 0 || dMax !== 50000) {
        const dep = parseAmountToManwon(p.deposit);
        if (dep !== null) {
          if (dep < dMin) return false;
          if (dMax < 50000 && dep > dMax) return false;
        }
      }

      // 월세 범위
      const [mMin, mMax] = filters.monthlyRange;
      if (mMin !== 0 || mMax !== 1000) {
        const mon = parseAmountToManwon(p.monthly);
        if (mon !== null) {
          if (mon < mMin) return false;
          if (mMax < 1000 && mon > mMax) return false;
        }
      }

      // 층수 범위
      const [fMin, fMax] = filters.floorRange;
      if (fMin !== -2 || fMax !== 30) {
        const fl = parseFloor(p.floor);
        if (fl !== null) {
          if (fl < fMin) return false;
          if (fMax < 30 && fl > fMax) return false;
        }
      }

      // 면적 범위
      const [aMin, aMax] = filters.areaRange;
      if (aMin !== 0 || aMax !== 200) {
        const ar = parseAreaToPyeong(p.area);
        if (ar !== null) {
          if (ar < aMin) return false;
          if (aMax < 200 && ar > aMax) return false;
        }
      }

      // 준공년도
      if (filters.buildYear.length > 0) {
        if (!matchBuildYear(p.buildYear, filters.buildYear)) return false;
      }

      // 건물 옵션 (options 배열 매칭)
      if (filters.buildingOptions.length > 0 || filters.roomOptions.length > 0) {
        const opts = (p.options ?? []).map((o) => o.toLowerCase());
        const allSelected = [...filters.buildingOptions, ...filters.roomOptions];
        const allMatch = allSelected.every((sel) =>
          opts.some((o) => o.includes(sel.toLowerCase()))
        );
        if (!allMatch) return false;
      }

      return true;
    });
  }, [properties, filters, activeTypes, query, propertyId]);
}
