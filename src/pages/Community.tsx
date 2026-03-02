import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, TrendingUp, HelpCircle, Megaphone, Search, Pencil, ThumbsUp, Eye, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  { key: "all", label: "전체" },
  { key: "notice", label: "공지사항", icon: Megaphone },
  { key: "info", label: "정보공유", icon: TrendingUp },
  { key: "qna", label: "Q&A", icon: HelpCircle },
  { key: "free", label: "자유게시판", icon: MessageSquare },
];

const POSTS = [
  {
    id: 1,
    category: "notice",
    categoryLabel: "공지사항",
    title: "집다 플랫폼 서비스 오픈 안내",
    author: "관리자",
    date: "2025.03.01",
    views: 1240,
    likes: 42,
    pinned: true,
    content: "안녕하세요. 집다 공인중개사 전용 플랫폼이 정식 오픈하였습니다. 많은 이용 부탁드립니다.",
  },
  {
    id: 2,
    category: "notice",
    categoryLabel: "공지사항",
    title: "매물 등록 가이드 업데이트",
    author: "관리자",
    date: "2025.02.25",
    views: 870,
    likes: 18,
    pinned: true,
    content: "매물 등록 시 필수 입력 항목이 추가되었습니다. 자세한 내용을 확인해주세요.",
  },
  {
    id: 3,
    category: "info",
    categoryLabel: "정보공유",
    title: "2025년 상가 임대 시장 동향 분석",
    author: "김중개사",
    date: "2025.02.28",
    views: 532,
    likes: 29,
    pinned: false,
    content: "올해 상가 임대 시장의 주요 트렌드를 분석했습니다.",
  },
  {
    id: 4,
    category: "qna",
    categoryLabel: "Q&A",
    title: "공동중개 수수료 정산 기준이 궁금합니다",
    author: "이공인",
    date: "2025.02.27",
    views: 311,
    likes: 11,
    pinned: false,
    content: "공동중개 시 수수료 정산 기준에 대해 문의드립니다.",
  },
  {
    id: 5,
    category: "free",
    categoryLabel: "자유게시판",
    title: "처음 가입했습니다. 잘 부탁드립니다!",
    author: "박부동산",
    date: "2025.02.26",
    views: 198,
    likes: 7,
    pinned: false,
    content: "안녕하세요, 처음 가입했습니다. 앞으로 잘 부탁드립니다.",
  },
  {
    id: 6,
    category: "info",
    categoryLabel: "정보공유",
    title: "LH 전세대출 조건 변경 내용 정리",
    author: "최공인",
    date: "2025.02.24",
    views: 688,
    likes: 35,
    pinned: false,
    content: "LH 전세대출 조건이 변경되었습니다. 중요 내용을 정리했습니다.",
  },
  {
    id: 7,
    category: "qna",
    categoryLabel: "Q&A",
    title: "매물 사진 몇 장까지 등록 가능한가요?",
    author: "정중개",
    date: "2025.02.23",
    views: 143,
    likes: 3,
    pinned: false,
    content: "매물 등록 시 사진 업로드 최대 개수가 궁금합니다.",
  },
  {
    id: 8,
    category: "free",
    categoryLabel: "자유게시판",
    title: "강남구 상가 공실 많이 나오고 있네요",
    author: "한공인",
    date: "2025.02.22",
    views: 421,
    likes: 15,
    pinned: false,
    content: "최근 강남구 상가 공실이 눈에 띄게 늘고 있습니다. 여러분은 어떻게 보시나요?",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  notice: "hsl(218 88% 22%)",
  info: "hsl(152 60% 40%)",
  qna: "hsl(22 100% 52%)",
  free: "hsl(215 16% 48%)",
};

const Community = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState<(typeof POSTS)[0] | null>(null);

  const filtered = POSTS.filter((p) => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchSearch = !search || p.title.includes(search) || p.author.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-screen-lg mx-auto w-full px-4 py-8">
        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">커뮤니티</h1>
            <p className="text-sm text-muted-foreground mt-0.5">공인중개사 전용 정보 교류 공간</p>
          </div>
          <Button
            className="gap-1.5 rounded-full font-semibold"
            style={{ background: "hsl(var(--accent))", color: "#fff" }}
            onClick={() => navigate("/signup")}
          >
            <Pencil className="w-3.5 h-3.5" />
            글쓰기
          </Button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-4">
          {CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all border"
              style={
                activeCategory === key
                  ? { background: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--primary))" }
                  : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
              }
            >
              {label}
            </button>
          ))}
          <div className="ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="검색어 입력"
                className="pl-8 h-8 text-sm w-48"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Post detail view */}
        {selectedPost ? (
          <div className="bg-card border border-border rounded-xl p-6">
            <button
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
              onClick={() => setSelectedPost(null)}
            >
              ← 목록으로
            </button>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${CATEGORY_COLORS[selectedPost.category]}18`, color: CATEGORY_COLORS[selectedPost.category] }}
              >
                {selectedPost.categoryLabel}
              </span>
              {selectedPost.pinned && (
                <span className="text-xs font-bold text-destructive">📌 공지</span>
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{selectedPost.title}</h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-6 pb-4 border-b border-border">
              <span>{selectedPost.author}</span>
              <span>{selectedPost.date}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{selectedPost.views}</span>
              <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{selectedPost.likes}</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{selectedPost.content}</p>
            <div className="mt-6 flex justify-center">
              <button
                className="flex items-center gap-1.5 px-5 py-2 rounded-full border text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
              >
                <ThumbsUp className="w-4 h-4" />
                추천 {selectedPost.likes}
              </button>
            </div>
          </div>
        ) : (
          /* Post list */
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[80px_1fr_80px_70px_70px] text-xs font-semibold text-muted-foreground bg-muted/50 px-4 py-2.5 border-b border-border">
              <span>분류</span>
              <span>제목</span>
              <span className="text-center">작성자</span>
              <span className="text-center">조회</span>
              <span className="text-center">추천</span>
            </div>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-sm text-muted-foreground">게시글이 없습니다.</div>
            )}
            {filtered.map((post, i) => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className={`grid md:grid-cols-[80px_1fr_80px_70px_70px] items-center px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                  i < filtered.length - 1 ? "border-b border-border" : ""
                } ${post.pinned ? "bg-primary/[0.03]" : ""}`}
              >
                <span
                  className="text-xs font-semibold w-fit px-2 py-0.5 rounded-full"
                  style={{ background: `${CATEGORY_COLORS[post.category]}18`, color: CATEGORY_COLORS[post.category] }}
                >
                  {post.categoryLabel}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  {post.pinned && <span className="text-destructive text-xs font-bold shrink-0">📌</span>}
                  <span className="text-sm font-medium text-foreground truncate">{post.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 hidden md:block" />
                </div>
                <span className="hidden md:block text-xs text-muted-foreground text-center">{post.author}</span>
                <span className="hidden md:flex items-center justify-center gap-0.5 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />{post.views}
                </span>
                <span className="hidden md:flex items-center justify-center gap-0.5 text-xs text-muted-foreground">
                  <ThumbsUp className="w-3 h-3" />{post.likes}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Community;
