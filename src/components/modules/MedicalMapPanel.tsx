import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Hospital, Pill, Search, ExternalLink } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "Barchasi", icon: MapPin, query: "hospital+OR+pharmacy" },
  { id: "hospital", label: "Shifoxonalar", icon: Hospital, query: "hospital+clinic" },
  { id: "pharmacy", label: "Dorixonalar", icon: Pill, query: "pharmacy+apteka" },
] as const;

const MedicalMapPanel = () => {
  const [category, setCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

  // Build Google Maps embed URL
  const q = searchQuery.trim()
    ? encodeURIComponent(searchQuery)
    : encodeURIComponent(`${selectedCat.query} near Tashkent Uzbekistan`);

  const embedUrl = `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${q}&zoom=13`;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The iframe will automatically update because q changes
  };

  const openInGoogleMaps = () => {
    const mapQ = searchQuery.trim()
      ? encodeURIComponent(searchQuery)
      : encodeURIComponent(`${selectedCat.query} near Tashkent Uzbekistan`);
    window.open(`https://www.google.com/maps/search/${mapQ}`, "_blank");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Tibbiy Xarita</h2>
          <p className="text-muted-foreground mt-1">Yaqin atrofdagi shifoxona va dorixonalar</p>
        </div>
        <button
          onClick={openInGoogleMaps}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground font-semibold text-sm hover:bg-secondary/80 transition-all"
        >
          <ExternalLink size={16} />
          Google Maps da ochish
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Shifoxona yoki dorixona qidirish..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </form>

      {/* Category Filters */}
      <div className="flex gap-2">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.id); setSearchQuery(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                category === cat.id
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              <Icon size={16} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-elevated bg-card" style={{ height: "calc(100vh - 320px)", minHeight: 400 }}>
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Medical Map"
          className="w-full h-full"
        />
      </div>
    </motion.div>
  );
};

export default MedicalMapPanel;
