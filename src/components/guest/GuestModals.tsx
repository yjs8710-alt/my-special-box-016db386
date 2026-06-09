import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Phone, MessageCircle, Building2, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addressToDong } from "@/hooks/useIsGuest";
import zibdaPlaceholder from "@/assets/zibda-placeholder-20260427-v2-20260427.png";

// ===== 협력 부동산 (하드코딩) =====
export const PARTNER_AGENCY = {
  name: "협력 공인중개사",
  representative: "협력 공인중개사",
  phone: "043-275-0966",
  mobile: "010-8182-8939",
  address: "충북 청주시 상당구 용암동 123-4",
  registration: "충북 청주 제2024-000123호",
  intro: "청주 지역 임대·매매 전문, 신뢰의 상담 파트너",
};

const Overlay = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) =>
  createPortal(
    <div
      className="fixed inset-0 z-[10300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );

// ===== 1. 문의하기 모달 (전화 필수) =====
export const InquiryModal = ({
  open,
  onClose,
  propertyId,
  propertyDbId,
  propertyRegNo,
  agentUserId,
  propertyTitle,
  onOpenPartner,
}: {
  open: boolean;
  onClose: () => void;
  propertyId?: number;
  propertyDbId?: string;
  propertyRegNo?: string;
  agentUserId?: string;
  propertyTitle?: string;
  onOpenPartner?: () => void;
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const formatPhone = (v: string) => {
    const d = v.replace(/[^0-9]/g, "").slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  };

  const submit = async () => {
    const trimmedName = name.trim();
    const phoneDigits = phone.replace(/[^0-9]/g, "");
    if (!trimmedName) return toast.error("이름을 입력해주세요");
    if (phoneDigits.length < 9) return toast.error("연락처를 정확히 입력해주세요");
    setSubmitting(true);
    try {
      const { error } = await supabase.from("guest_inquiries").insert({
        property_id: propertyDbId || null,
        property_reg_no: propertyRegNo || null,
        agent_user_id: agentUserId || null,
        name: trimmedName,
        phone: phone.trim(),
        message: message.trim() || (propertyTitle ? `[${propertyTitle}] 문의드립니다` : "매물 문의드립니다"),
      });
      if (error) throw error;
      toast.success("문의가 접수되었습니다. 담당자가 연락드릴 예정입니다.");
      setName("");
      setPhone("");
      setMessage("");
      onClose();
    } catch (e: any) {
      console.error("[InquiryModal]", e);
      toast.error("문의 접수에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" /> 채팅 문의하기
        </h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 space-y-3">
        {propertyTitle && (
          <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
            매물: <span className="font-semibold text-foreground">{propertyTitle}</span>
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-foreground">이름 <span className="text-destructive">*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="홍길동"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground">연락처 <span className="text-destructive">*</span></label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            className="mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="010-0000-0000"
          />
          <p className="text-[10px] text-muted-foreground mt-1">담당자가 입력하신 번호로 연락드립니다</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground">문의 내용</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={3}
            className="mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="문의하실 내용을 입력해주세요"
          />
        </div>
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm disabled:opacity-60"
        >
          {submitting ? "전송 중..." : "문의 보내기"}
        </button>
        {onOpenPartner && (
          <button
            onClick={() => { onClose(); onOpenPartner(); }}
            className="w-full py-2 rounded-lg border border-primary text-primary font-semibold text-xs flex items-center justify-center gap-1"
          >
            <Building2 className="w-3.5 h-3.5" /> 협력 부동산 정보 보기
          </button>
        )}
      </div>
    </Overlay>
  );
};

// ===== 2. 협력업체(봄날부동산) 모달 =====
export const PartnerAgencyModal = ({
  open,
  onClose,
  onChat,
}: {
  open: boolean;
  onClose: () => void;
  onChat?: () => void;
}) => {
  if (!open) return null;
  const a = PARTNER_AGENCY;
  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" /> 협력 부동산
        </h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 space-y-3">
        <div className="text-center pb-2 border-b">
          <h4 className="text-lg font-bold text-foreground">{a.name}</h4>
          <p className="text-xs text-muted-foreground mt-1">{a.intro}</p>
        </div>
        <dl className="space-y-1.5 text-sm">
          <div className="flex"><dt className="w-20 text-muted-foreground text-xs">대표</dt><dd className="font-medium">{a.representative}</dd></div>
          <div className="flex"><dt className="w-20 text-muted-foreground text-xs">전화</dt><dd className="font-medium">{a.phone}</dd></div>
          <div className="flex"><dt className="w-20 text-muted-foreground text-xs">휴대전화</dt><dd className="font-medium">{a.mobile}</dd></div>
          <div className="flex"><dt className="w-20 text-muted-foreground text-xs">주소</dt><dd className="font-medium text-xs">{a.address}</dd></div>
          <div className="flex"><dt className="w-20 text-muted-foreground text-xs">등록번호</dt><dd className="font-medium text-xs">{a.registration}</dd></div>
        </dl>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <a
            href={`tel:${a.mobile.replace(/[^0-9]/g, "")}`}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm"
          >
            <Phone className="w-4 h-4" /> 전화하기
          </a>
          <button
            onClick={() => { onClose(); onChat?.(); }}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 border-primary text-primary font-bold text-sm"
          >
            <MessageCircle className="w-4 h-4" /> 채팅 문의
          </button>
        </div>
      </div>
    </Overlay>
  );
};

// ===== 3. 카카오톡 스타일 공유 모달 =====
export const GuestShareModal = ({
  open,
  onClose,
  title,
  address,
  image,
  deposit,
  monthly,
  area,
  floor,
  type,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  address?: string;
  image?: string;
  deposit?: string;
  monthly?: string;
  area?: string;
  floor?: string;
  type?: string;
}) => {
  if (!open) return null;
  const url = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("링크가 복사되었습니다");
    } catch {
      toast.error("링크 복사 실패");
    }
  };
  const shareNative = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: title || "매물 공유", text: address, url }); } catch {}
    } else {
      copyLink();
    }
  };

  return (
    <Overlay onClose={onClose}>
      {/* 카카오톡 메시지 카드 스타일 */}
      <div className="bg-[#abc1d1] p-4">
        <div className="bg-white rounded-xl overflow-hidden shadow-lg">
          {image ? (
            <img src={image} alt={title} className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-40 bg-muted flex items-center justify-center text-muted-foreground text-xs">이미지 없음</div>
          )}
          <div className="p-3">
            <div className="text-[11px] text-muted-foreground mb-1">{type || "매물"}</div>
            <h3 className="font-bold text-sm text-foreground line-clamp-1">{title || "매물 정보"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{address}</p>
            <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs">
              <span className="font-bold text-primary">{deposit} / {monthly}</span>
              <span className="text-muted-foreground">{area} · {floor}</span>
            </div>
          </div>
          <div className="border-t px-3 py-2 text-center text-[11px] text-muted-foreground bg-muted/50">
            zibda.co.kr 에서 확인
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button onClick={shareNative} className="flex flex-col items-center gap-1 py-3 rounded-lg hover:bg-muted">
            <Share2 className="w-5 h-5 text-primary" />
            <span className="text-[11px] font-medium">공유</span>
          </button>
          <button onClick={copyLink} className="flex flex-col items-center gap-1 py-3 rounded-lg hover:bg-muted">
            <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary">🔗</div>
            <span className="text-[11px] font-medium">링크 복사</span>
          </button>
          <button
            onClick={() => {
              if (navigator.share) shareNative();
              else copyLink();
            }}
            className="flex flex-col items-center gap-1 py-3 rounded-lg hover:bg-muted"
          >
            <MessageCircle className="w-5 h-5 text-[#fee500]" style={{ fill: "#fee500" }} />
            <span className="text-[11px] font-medium">카톡</span>
          </button>
        </div>
        <div className="pt-3 border-t text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">제공</p>
          <p className="text-xs font-bold text-foreground">협력 부동산</p>
        </div>
        <button
          onClick={onClose}
          className="mt-3 w-full py-2 rounded-lg bg-muted text-foreground text-sm font-semibold"
        >
          닫기
        </button>
      </div>
    </Overlay>
  );
};

// ===== 4. 매물 상세보기 (공유페이지를 iframe으로 렌더) =====
export interface GuestDetailInfo {
  image?: string;
  address?: string;
  type?: string;
  area?: string;
  floor?: string;
  deposit?: string;
  monthly?: string;
  regNo?: string;
  buildYear?: string;
  dbId?: string;
}

export const GuestDetailModal = ({
  open,
  onClose,
  info,
  onInquiry,
}: {
  open: boolean;
  onClose: () => void;
  info?: GuestDetailInfo;
  onInquiry?: () => void;
}) => {
  if (!open || !info) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const canShare = !!info.dbId && uuidRegex.test(info.dbId);
  const shareUrl = canShare ? `/share/${info.dbId}?embed=1` : "";

  return createPortal(
    <div
      className="fixed inset-0 z-[10300] flex items-center justify-center p-3 md:p-6"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl w-full max-w-2xl h-[90vh] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-white">
          <p className="text-sm font-extrabold text-foreground">매물 상세보기</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden bg-muted">
          {canShare ? (
            <iframe
              src={shareUrl}
              title="매물 상세보기"
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              상세 정보를 불러올 수 없습니다.
            </div>
          )}
        </div>
        <div className="px-4 py-2.5 border-t bg-white">
          <button
            onClick={() => { onClose(); onInquiry?.(); }}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold"
          >
            협력 공인중개사 문의
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

