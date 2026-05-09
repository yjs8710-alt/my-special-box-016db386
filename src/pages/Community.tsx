import { useState } from "react";
import { MessageSquare, TrendingUp, HelpCircle, Megaphone, Search, Pencil, ThumbsUp, Eye, ChevronRight, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = [
  { key: "all", label: "전체" },
  { key: "notice", label: "공지사항", icon: Megaphone },
  { key: "info", label: "정보공유", icon: TrendingUp },
  { key: "qna", label: "Q&A", icon: HelpCircle },
  { key: "free", label: "자유게시판", icon: MessageSquare },
  { key: "improvement", label: "개선사항", icon: TrendingUp },
];

// 글쓰기에서 선택 가능한 카테고리 (공지사항 제외)
const WRITABLE_CATEGORIES = CATEGORIES.filter((c) => c.key !== "all" && c.key !== "notice");

type Post = {
  id: number;
  category: string;
  categoryLabel: string;
  title: string;
  author: string;
  date: string;
  views: number;
  likes: number;
  pinned: boolean;
  content: string;
};

const INITIAL_POSTS: Post[] = [];

const CATEGORY_COLORS: Record<string, string> = {
  notice: "hsl(218 88% 22%)",
  info: "hsl(152 60% 40%)",
  qna: "hsl(22 100% 52%)",
  free: "hsl(215 16% 48%)",
  improvement: "hsl(262 80% 50%)",
};

const Community = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // 글쓰기 모달 상태
  const [showWrite, setShowWrite] = useState(false);
  const [writeCategory, setWriteCategory] = useState(WRITABLE_CATEGORIES[0].key);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");

  const filtered = posts.filter((p) => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchSearch = !search || p.title.includes(search) || p.author.includes(search);
    return matchCat && matchSearch;
  });

  const openWrite = () => {
    setWriteCategory(WRITABLE_CATEGORIES[0].key);
    setWriteTitle("");
    setWriteContent("");
    setShowWrite(true);
  };

  const submitPost = () => {
    if (!writeTitle.trim() || !writeContent.trim()) return;
    const cat = WRITABLE_CATEGORIES.find((c) => c.key === writeCategory)!;
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
    const newPost: Post = {
      id: Date.now(),
      category: cat.key,
      categoryLabel: cat.label,
      title: writeTitle.trim(),
      author: "회원",
      date: dateStr,
      views: 0,
      likes: 0,
      pinned: false,
      content: writeContent.trim(),
    };
    setPosts((prev) => [newPost, ...prev]);
    setShowWrite(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-screen-lg mx-auto w-full px-4 py-8">
        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">커뮤니티</h1>
          </div>
          <Button
            className="gap-1.5 rounded-full font-semibold"
            style={{ background: "hsl(var(--accent))", color: "#fff" }}
            onClick={openWrite}
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
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
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
                className={`grid grid-cols-[auto_1fr] md:grid-cols-[80px_1fr_80px_70px_70px] items-center px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                  i < filtered.length - 1 ? "border-b border-border" : ""
                } ${post.pinned ? "bg-primary/[0.03]" : ""}`}
              >
                <span
                  className="text-xs font-semibold w-fit px-2 py-0.5 rounded-full"
                  style={{ background: `${CATEGORY_COLORS[post.category]}18`, color: CATEGORY_COLORS[post.category] }}
                >
                  {post.categoryLabel}
                </span>
                <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {post.pinned && <span className="text-destructive text-xs font-bold shrink-0">📌</span>}
                    <span className="text-sm font-medium text-foreground truncate">{post.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 hidden md:block" />
                  </div>
                  <span className="text-xs text-muted-foreground md:hidden">{post.author}</span>
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

      {/* 글쓰기 모달 */}
      {showWrite && (
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowWrite(false)}
        >
          <div
            className="bg-card border border-border rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">게시글 작성</h3>
              <button
                onClick={() => setShowWrite(false)}
                className="text-muted-foreground hover:text-foreground"
                style={{ color: "hsl(var(--primary))" }}
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">머리글(분류)</label>
                <div className="flex gap-2 flex-wrap">
                  {WRITABLE_CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setWriteCategory(c.key)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                      style={
                        writeCategory === c.key
                          ? { background: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--primary))" }
                          : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                      }
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">제목</label>
                <Input
                  value={writeTitle}
                  onChange={(e) => setWriteTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">내용</label>
                <Textarea
                  value={writeContent}
                  onChange={(e) => setWriteContent(e.target.value)}
                  placeholder="내용을 입력하세요"
                  rows={8}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowWrite(false)}>
                취소
              </Button>
              <Button
                onClick={submitPost}
                disabled={!writeTitle.trim() || !writeContent.trim()}
                style={{ background: "hsl(var(--accent))", color: "#fff" }}
              >
                등록
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Community;
