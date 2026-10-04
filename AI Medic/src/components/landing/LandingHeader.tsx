import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Moon, Sun, Menu, X } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate, useLocation } from "react-router-dom";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

interface LandingHeaderProps {
  onGetStarted: () => void;
}

const LandingHeader = ({ onGetStarted }: LandingHeaderProps) => {
  const { t } = useLanguage();
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: t("landing.nav.home"), href: "/" },
    { label: t("landing.nav.about"), href: "/about" },
    { label: t("landing.nav.departments"), href: "/departments" },
    { label: t("landing.nav.services"), href: "/services" },
    { label: t("landing.nav.contact"), href: "/contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-2 sm:mx-4 mt-[max(0.5rem,env(safe-area-inset-top))] sm:mt-3">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto bg-card/70 backdrop-blur-2xl rounded-2xl border border-border/50 shadow-elevated px-2.5 sm:px-4 py-2 sm:py-3"
        >
          <div className="flex items-center justify-between gap-1.5">
            <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2 min-w-0 shrink">
              <motion.img
                src={logo}
                alt="AI Medic"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <h1 className="text-base sm:text-xl font-display font-bold text-foreground whitespace-nowrap">AI Medic</h1>
            </Button>

            <nav className="hidden lg:flex items-center gap-1 min-w-0">
              {navLinks.map((link) => (
                <Button variant="ghost"
                  key={link.href}
                  onClick={() => navigate(link.href)}
                  className={`px-3 xl:px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                    location.pathname === link.href
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {link.label}
                </Button>
              ))}
            </nav>

            <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
              <Button variant="ghost" size="icon"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label={t("landing.searchPlaceholder")}
                className="p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <Search size={16} />
              </Button>
              <Button variant="ghost" size="icon"
                onClick={toggle}
                aria-label={t(theme === "dark" ? "nav.lightMode" : "nav.darkMode")}
                className="p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </Button>
              <LanguageSwitcher compact />
              <Button
                onClick={onGetStarted}
                className="gradient-primary text-primary-foreground px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-glow whitespace-nowrap"
              >
                {t("landing.login")}
              </Button>
              <Button variant="ghost" size="icon"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={t("landing.nav.menu")}
                aria-expanded={menuOpen}
                className="lg:hidden p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </Button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {menuOpen && (
              <motion.nav
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="lg:hidden overflow-hidden"
              >
                <div className="mt-2 pt-2 border-t border-border/50 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {navLinks.map((link) => (
                    <Button variant="ghost"
                      key={link.href}
                      onClick={() => {
                        navigate(link.href);
                        setMenuOpen(false);
                      }}
                      className={`px-3 py-2 text-sm font-medium rounded-xl text-left transition-all ${
                        location.pathname === link.href
                          ? "text-foreground bg-secondary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {link.label}
                    </Button>
                  ))}
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </motion.div>
      </div>


      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 mt-2"
          >
            <div className="max-w-6xl mx-auto bg-card/80 backdrop-blur-2xl rounded-2xl border border-border/50 shadow-elevated px-4 py-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  placeholder={t("landing.searchPlaceholder")}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default LandingHeader;
