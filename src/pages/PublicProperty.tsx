import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, Layers, Car, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import logoTransparent from "@/assets/logo-transparent.png";

interface PropertyData {
  id: string;
  title: string;
  building_name: string | null;
  address: string;
  type: string;
  room_type: string | null;
  area: string;
  floor: string;
  total_floors: string;
  deposit: string;
  monthly: string;
  manage_fee: string;
  parking: string;
  elevator: boolean;
  available_from: string;
  build_year: string;
  description: string;
  images: string[];
  options: string[];
  is_new: boolean;
  is_hot: boolean;
  registered_date: string;
  registered_by: string | null;
}

interface AgentData {
  name: string;
  phone: string;
  agency_name: string;
  agency_address: string;
  license_number: string;
  member_type: string;
}

/** 주소에서 동/리 까지만 남기고 번지 이하 제거 */
function sanitizeAddress(address: string): string {
  if (!address) return "";
  const match = address.match(
    /(?:.*?(?:시|군)\s+)?(?:.*?(?:구|군)\s+)?[\uAC00-\uD7A3]+(?:동|리|읍|면)/
  );
  return match ? match[0] : address.split(" ").slice(0, -1).join(" ") || address;
}

export default function PublicProperty() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id,title,building_name,address,type,room_type,area,floor,total_floors,deposit,monthly,manage_fee,parking,elevator,available_from,build_year,description,images,options,is_new,is_hot,registered_date,registered_by")
        .eq("id", id)
        .eq("status", "active")
        .single();
      if (!error && data) {
        setProperty(data);
        // Fetch agent info
        if (data.registered_by) {
          const { data: agentData } = await supabase
            .from("agent_profiles")
            .select("name,phone,agency_name,agency_address,license_number,member_type")
            .eq("user_id", data.registered_by)
            .single();
          if (agentData) setAgent(agentData);
        }
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-6">
        <Building2 className="w-16 h-16 text-muted-foreground/30" />
        <p className="text-lg font-bold text-foreground">매물을 찾을 수 없습니다</p>
        <p className="text-sm text-muted-foreground">삭제되었거나 비공개 처리된 매물입니다.</p>
        <a href="https://jibda.co.kr" className="mt-4 px-6 py-2.5 rounded-full text-sm font-bold text-white bg-primary hover:opacity-90 transition-opacity">
          집다 홈으로
        </a>
      </div>
    );
  }

  const imgs = (property.images || []).filter(Boolean);
  const safeAddress = sanitizeAddress(property.address);

  const prev = () => setImgIdx((i) => (i - 1 + imgs.length) % imgs.length);
  const next = () => setImgIdx((i) => (i + 1) % imgs.length);

  const isSale = property.type?.includes("매매");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-2 flex items-center justify-between">
        <a href="https://jibda.co.kr" className="flex items-center gap-1.5">
          <img src={logoTransparent} alt="집다" className="h-8 w-auto" />
        </a>
        <a href="https://jibda.co.kr/login" className="text-xs font-bold text-primary hover:underline">로그인</a>
      </header>

      <div className="max-w-lg mx-auto pb-24">
        {/* Image carousel */}
        {imgs.length > 0 ? (
          <div className="relative aspect-[4/3] bg-muted overflow-hidden">
            {imgs.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${property.title} ${i + 1}`}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                style={{ opacity: i === imgIdx ? 1 : 0 }}
              />
            ))}
            {imgs.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {imgIdx + 1} / {imgs.length}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="aspect-[4/3] bg-muted flex items-center justify-center">
            <Building2 className="w-16 h-16 text-muted-foreground/20" />
          </div>
        )}

        {/* Content */}
        <div className="p-5 flex flex-col gap-5">
          {/* Badges + Title */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">{property.type}</span>
              {property.room_type && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground">{property.room_type}</span>
              )}
              {property.is_new && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-white">NEW</span>}
              {property.is_hot && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive text-white">HOT</span>}
            </div>
            <h1 className="text-xl font-bold text-foreground">{property.building_name || property.title}</h1>
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {safeAddress}
            </div>
          </div>

          {/* Price */}
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground mb-1">{isSale ? "매매가" : "보증금 / 월세"}</p>
            <p className="text-2xl font-black text-foreground">
              {isSale ? property.deposit : `${property.deposit} / ${property.monthly}`}
            </p>
            {!isSale && property.manage_fee && (
              <p className="text-xs text-muted-foreground mt-1">관리비 {property.manage_fee}</p>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Layers className="w-4 h-4" />, label: "면적", value: property.area },
              { icon: <Building2 className="w-4 h-4" />, label: "층", value: `${property.floor} / ${property.total_floors}층` },
              { icon: <Car className="w-4 h-4" />, label: "주차", value: property.parking || "확인필요" },
              { icon: <Calendar className="w-4 h-4" />, label: "입주가능", value: property.available_from || "즉시" },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{item.icon}</div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-xs font-bold text-foreground">{item.value || "-"}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Options */}
          {property.options && property.options.length > 0 && (
            <div>
              <p className="text-xs font-bold text-foreground mb-2">옵션</p>
              <div className="flex flex-wrap gap-1.5">
                {property.options.map((opt, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-foreground border border-border">
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div>
              <p className="text-xs font-bold text-foreground mb-2">상세 설명</p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{property.description}</p>
            </div>
          )}

          {/* Build info */}
          <div className="rounded-xl border border-border bg-muted/30 p-3 flex items-center gap-3">
            <div className="text-xs text-muted-foreground">
              건축년도 <span className="font-bold text-foreground">{property.build_year || "-"}</span>
              {" · "}엘리베이터 <span className="font-bold text-foreground">{property.elevator ? "있음" : "없음"}</span>
            </div>
          </div>

          {/* Agent / Office info */}
          {agent && (
            <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2">
              <p className="text-xs font-bold text-primary mb-1">공유 중개사무소</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                <span className="text-muted-foreground">사무소명</span>
                <span className="font-bold text-foreground">{agent.agency_name}</span>
                <span className="text-muted-foreground">대표자</span>
                <span className="font-bold text-foreground">{agent.name}</span>
                <span className="text-muted-foreground">주소</span>
                <span className="text-foreground">{agent.agency_address}</span>
                <span className="text-muted-foreground">연락처</span>
                <a href={`tel:${agent.phone}`} className="font-bold text-primary">{agent.phone}</a>
                <span className="text-muted-foreground">개설등록번호</span>
                <span className="text-foreground">{agent.license_number}</span>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex justify-center z-40">
          <a
            href="https://jibda.co.kr"
            className="w-full max-w-lg h-12 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            집다에서 더 많은 매물 보기
          </a>
        </div>
      </div>
    </div>
  );
}
