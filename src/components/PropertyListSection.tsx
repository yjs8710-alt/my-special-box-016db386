import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyCard from "./PropertyCard";
import { useDBProperties } from "@/hooks/useDBProperties";

const TYPES = ["전체", "상가", "사무실", "식당·카페", "공장·창고", "병원·학원"];
const SORTS = ["최신순", "낮은 월세순", "조회순", "면적순"];

const PropertyListSection = () => {
  const [activeType, setActiveType] = useState("전체");
  const [sortBy, setSortBy] = useState("최신순");
  const { properties: dbProperties, loading } = useDBProperties();

  const filtered = activeType === "전체"
    ? properties
    : properties.filter((p) => p.type === activeType);

  const handleDelete = (id: number) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">최신 공실 매물</h2>
          <p className="text-sm text-muted-foreground mt-1">
            총 <span className="font-semibold text-primary">{filtered.length}개</span>의 매물이 있습니다
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-card border border-border rounded-lg px-4 py-2 text-sm font-medium text-foreground pr-8 outline-none cursor-pointer hover:border-primary transition-colors"
            >
              {SORTS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 font-medium">
            <SlidersHorizontal className="w-4 h-4" />
            필터
          </Button>
        </div>
      </div>

      {/* Type Filter Chips */}
      <div className="flex gap-2 flex-wrap mb-8">
        {TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              activeType === type
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary hover:text-primary"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((property) => (
          <PropertyCard key={property.id} {...property} onDelete={() => handleDelete(property.id)} />
        ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center mt-10">
        <Button
          variant="outline"
          size="lg"
          className="px-10 font-medium border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          더 보기
        </Button>
      </div>
    </section>
  );
};

export default PropertyListSection;
