import { useEffect, useState } from "react";
import { APP_VERSION } from "@/lib/appVersion";

interface DomainStatus {
  url: string;
  label: string;
  loading: boolean;
  reachable: boolean;
  ssl: "valid" | "invalid" | "unknown";
  htmlHash: string | null;
  assetHashes: string[];
  matchesCurrent: boolean | null;
  error?: string;
  fetchedAt?: string;
}

const TARGETS = [
  { url: "https://jibda.co.kr", label: "jibda.co.kr (root)" },
  { url: "https://www.jibda.co.kr", label: "www.jibda.co.kr" },
  { url: "https://my-special-box.lovable.app", label: "lovable.app (기준)" },
];

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

function extractAssetHashes(html: string): string[] {
  // Vite 기본: assets/name-[hash].js|css
  const re = /assets\/[\w-]+-([A-Za-z0-9_-]{6,12})\.(?:js|css)/g;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) set.add(m[1]);
  return Array.from(set);
}

async function probe(url: string): Promise<Omit<DomainStatus, "label" | "url" | "loading">> {
  try {
    const bust = `?_=${Date.now()}`;
    const res = await fetch(url + "/" + bust, {
      method: "GET",
      cache: "no-store",
      mode: "cors",
      credentials: "omit",
    });
    if (!res.ok) {
      return {
        reachable: false,
        ssl: "unknown",
        htmlHash: null,
        assetHashes: [],
        matchesCurrent: null,
        error: `HTTP ${res.status}`,
        fetchedAt: new Date().toLocaleTimeString(),
      };
    }
    const html = await res.text();
    const htmlHash = await sha256(html);
    const assetHashes = extractAssetHashes(html);
    return {
      reachable: true,
      ssl: url.startsWith("https://") ? "valid" : "unknown",
      htmlHash,
      assetHashes,
      matchesCurrent: null,
      fetchedAt: new Date().toLocaleTimeString(),
    };
  } catch (e: any) {
    // CORS 차단되면 fetch가 실패함 → no-cors로 도달성만 확인
    try {
      await fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-store" });
      return {
        reachable: true,
        ssl: url.startsWith("https://") ? "valid" : "unknown",
        htmlHash: null,
        assetHashes: [],
        matchesCurrent: null,
        error: "CORS 차단 - 해시 비교 불가 (도달은 가능)",
        fetchedAt: new Date().toLocaleTimeString(),
      };
    } catch (err: any) {
      return {
        reachable: false,
        ssl: "invalid",
        htmlHash: null,
        assetHashes: [],
        matchesCurrent: null,
        error: err?.message || e?.message || "네트워크 오류",
        fetchedAt: new Date().toLocaleTimeString(),
      };
    }
  }
}

export default function DomainCheck() {
  const [statuses, setStatuses] = useState<DomainStatus[]>(
    TARGETS.map((t) => ({
      ...t,
      loading: true,
      reachable: false,
      ssl: "unknown",
      htmlHash: null,
      assetHashes: [],
      matchesCurrent: null,
    }))
  );
  const [currentHost, setCurrentHost] = useState("");
  const [currentAssets, setCurrentAssets] = useState<string[]>([]);

  const runCheck = async () => {
    setStatuses((prev) => prev.map((s) => ({ ...s, loading: true })));

    // 현재 페이지의 자산 해시 추출 (기준)
    const ownAssets = Array.from(document.querySelectorAll("script[src], link[href]"))
      .map((el) => (el as HTMLScriptElement).src || (el as HTMLLinkElement).href)
      .join(" ");
    const ownHashes = extractAssetHashes(ownAssets);
    setCurrentAssets(ownHashes);

    const results = await Promise.all(TARGETS.map((t) => probe(t.url)));
    setStatuses(
      TARGETS.map((t, i) => {
        const r = results[i];
        const matches =
          r.assetHashes.length > 0 && ownHashes.length > 0
            ? r.assetHashes.some((h) => ownHashes.includes(h))
            : null;
        return {
          ...t,
          loading: false,
          ...r,
          matchesCurrent: matches,
        };
      })
    );
  };

  useEffect(() => {
    setCurrentHost(window.location.host);
    runCheck();
    document.title = "도메인 빌드 진단 - 집다";
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            도메인 빌드 / SSL 진단
          </h1>
          <p className="text-sm text-muted-foreground">
            현재 호스트: <code className="bg-muted px-2 py-0.5 rounded">{currentHost}</code>
            {" · "}
            앱 버전: <code className="bg-muted px-2 py-0.5 rounded">{APP_VERSION}</code>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            현재 페이지 자산 해시:{" "}
            {currentAssets.length > 0 ? (
              <code className="bg-muted px-2 py-0.5 rounded">
                {currentAssets.join(", ")}
              </code>
            ) : (
              <span className="italic">(개발 모드 또는 미감지)</span>
            )}
          </p>
        </div>

        <button
          onClick={runCheck}
          className="mb-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm font-medium"
        >
          다시 검사
        </button>

        <div className="space-y-3">
          {statuses.map((s) => (
            <div
              key={s.url}
              className="bg-card border border-border rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{s.label}</span>
                    {s.loading && (
                      <span className="text-xs text-muted-foreground animate-pulse">
                        검사중…
                      </span>
                    )}
                  </div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline break-all"
                  >
                    {s.url}
                  </a>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge
                    ok={s.reachable}
                    label={s.reachable ? "도달 OK" : "도달 실패"}
                  />
                  <Badge
                    ok={s.ssl === "valid"}
                    label={
                      s.ssl === "valid"
                        ? "SSL 유효"
                        : s.ssl === "invalid"
                          ? "SSL 오류"
                          : "SSL 미확인"
                    }
                  />
                  {s.matchesCurrent !== null && (
                    <Badge
                      ok={s.matchesCurrent}
                      label={
                        s.matchesCurrent ? "최신 빌드 일치" : "이전 빌드 (불일치)"
                      }
                    />
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">HTML 해시: </span>
                  <code className="bg-muted px-1.5 py-0.5 rounded">
                    {s.htmlHash || "—"}
                  </code>
                </div>
                <div>
                  <span className="text-muted-foreground">자산 해시: </span>
                  <code className="bg-muted px-1.5 py-0.5 rounded break-all">
                    {s.assetHashes.length > 0 ? s.assetHashes.join(", ") : "—"}
                  </code>
                </div>
              </div>

              {s.error && (
                <div className="mt-2 text-xs text-destructive">⚠ {s.error}</div>
              )}
              {s.fetchedAt && (
                <div className="mt-2 text-[10px] text-muted-foreground">
                  검사 시각: {s.fetchedAt}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">읽는 법</p>
          <p>
            • <b>최신 빌드 일치</b>: 해당 도메인 HTML이 참조하는 JS/CSS 해시가 현재
            보고 있는 페이지와 같은 빌드인지 비교한 결과입니다.
          </p>
          <p>
            • <b>CORS 차단</b>: 보안상 다른 도메인 HTML을 직접 읽지 못할 수 있습니다.
            이 경우 도달성/SSL만 확인 가능합니다. 정확한 비교는 네이버 인앱에서 직접
            이 페이지를 열어 보세요.
          </p>
          <p>
            • 네이버 인앱에서 <code>/domain-check</code>를 열면, 그 환경 기준의 자산
            해시를 보여주므로 캐시 잔존 여부를 식별할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
        ok
          ? "bg-green-500/15 text-green-600 dark:text-green-400"
          : "bg-destructive/15 text-destructive"
      }`}
    >
      {label}
    </span>
  );
}
