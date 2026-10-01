import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Mail, Phone, Send, Github, Linkedin, Instagram, MapPin, Shield, Sparkles, HeartPulse, ArrowUpRight,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";

const socials = [
  { icon: Send, href: "https://t.me/Jovliyev_Bobur", label: "Telegram" },
  { icon: Github, href: "https://github.com/JBoburHacker005", label: "GitHub" },
  { icon: Linkedin, href: "https://linkedin.com/in/Bobur005", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com/j.bobur005", label: "Instagram" },
];

const columns: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "footer.platform",
    links: [
      { label: "landing.nav.home", to: "/" },
      { label: "landing.nav.about", to: "/about" },
      { label: "landing.nav.departments", to: "/departments" },
      { label: "landing.nav.contact", to: "/contact" },
    ],
  },
  {
    title: "footer.services",
    links: [
      { label: "nav.radiologist", to: "/?auth=1" },
      { label: "nav.advisor", to: "/?auth=1" },
      { label: "footer.nutrition", to: "/?auth=1" },
      { label: "footer.consultation", to: "/?auth=1" },
    ],
  },
  {
    title: "footer.resources",
    links: [
      { label: "nav.doctors", to: "/departments" },
      { label: "footer.faq", to: "/" },
      { label: "footer.security", to: "/about" },
      { label: "footer.privacy", to: "/about" },
    ],
  },
];

const SiteFooter = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <footer className="relative z-10 mt-24">
      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="relative bg-card/50 backdrop-blur-2xl border-t border-border/50">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />

        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-10">
          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ rotateX: 3, rotateY: -2 }}
            style={{ transformStyle: "preserve-3d", perspective: 1000 }}
            className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card/60 to-transparent p-5 sm:p-8 md:p-10 shadow-elevated flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
                 <Sparkles className="text-primary" size={24} /> {t("footer.cta")}
              </h3>
              <p className="text-muted-foreground mt-2 max-w-xl">
                 {t("footer.ctaDesc")}
              </p>
            </div>
             <Button
              onClick={() => navigate("/?auth=1")}
               className="gradient-primary text-primary-foreground px-7 py-3.5 h-auto rounded-lg font-semibold shadow-glow flex items-center gap-2 shrink-0"
            >
               {t("landing.getStarted")} <ArrowUpRight size={18} />
             </Button>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mt-14">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <motion.img
                  src={logo}
                  alt="AI Medic"
                  className="w-11 h-11 object-contain shadow-glow"
                  whileHover={{ scale: 1.05 }}
                />
                <div>
                  <p className="font-display font-bold text-foreground text-lg">AI Medic</p>
                   <p className="text-xs text-muted-foreground">{t("brand.tagline")}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-sm">
                 {t("footer.about")}
              </p>

              <div className="flex gap-3 mt-6">
                {socials.map((s, i) => (
                  <motion.a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -5, rotate: -8, scale: 1.1 }}
                    className="w-11 h-11 rounded-2xl bg-secondary/70 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary-foreground hover:bg-primary transition-colors shadow-card"
                  >
                    <s.icon size={18} />
                  </motion.a>
                ))}
              </div>
            </div>

            {columns.map((col, ci) => (
              <motion.div
                key={col.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: ci * 0.08 }}
              >
                 <p className="font-semibold text-foreground mb-4">{t(col.title)}</p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                       <Button variant="ghost" size="sm"
                        onClick={() => navigate(l.to)}
                        className="group text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <span className="w-0 group-hover:w-3 h-px bg-primary transition-all duration-300" />
                         {t(l.label)}
                       </Button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Contact strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
            {[
              { icon: Mail, label: "jbobur005@gmail.com", href: "mailto:jbobur005@gmail.com" },
              { icon: Phone, label: "+998 (93) 005-42-87", href: "tel:+998930054287" },
               { icon: MapPin, label: t("footer.location"), href: "/contact" },
            ].map((c, i) => (
              <motion.a
                key={c.label}
                href={c.href}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/50 px-4 py-3.5 text-sm text-muted-foreground hover:border-primary/40 transition-colors"
              >
                <c.icon size={17} className="text-primary shrink-0" />
                <span className="truncate">{c.label}</span>
              </motion.a>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-6 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
             <p>© 2026 AI Medic. {t("landing.footer")}</p>
            <div className="flex items-center gap-5">
               <span className="flex items-center gap-1.5"><Shield size={13} className="text-accent" /> {t("brand.security")}</span>
               <span className="flex items-center gap-1.5"><HeartPulse size={13} className="text-primary" /> {t("footer.powered")}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
