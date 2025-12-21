
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";


export default function Home() {
  const { t } = useTranslation();
  const sekbidNames = [
    t("home.sekbid1") || "Sekbid 1",
    t("home.sekbid2") || "Sekbid 2",
    t("home.sekbid3") || "Sekbid 3",
    t("home.sekbid4") || "Sekbid 4",
    t("home.sekbid5") || "Sekbid 5",
    t("home.sekbid6") || "Sekbid 6",
  ];
  const adminName = t("navbar.adminLogin") || "Admin";
  return (
    <div className="font-sans min-h-screen bg-ds-bg dark:bg-ds-dark-bg flex flex-col items-center justify-start py-8 px-4">
      <header className="w-full max-w-5xl text-center mb-8 px-2">
        <h1 className="text-[1.75rem] sm:text-3xl md:text-4xl font-playfair leading-snug text-ds-text-light dark:text-ds-text-dark mb-2">{t("home.osisName")}</h1>
        <p className="text-mobile-sub text-ds-muted dark:text-ds-text-dark mb-2">{t("home.subtitle")}</p>
        <p className="text-mobile-body text-ds-muted dark:text-ds-text-dark max-w-2xl mx-auto">{t("home.description")}</p>
      </header>
      <main className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12 px-2">
        {[
          { name: sekbidNames[0], href: "/sekbid/sekbid-1", color: "bg-ds-panel" },
          { name: sekbidNames[1], href: "/sekbid/sekbid-2", color: "bg-ds-panel" },
          { name: sekbidNames[2], href: "/sekbid/sekbid-3", color: "bg-ds-panel" },
          { name: sekbidNames[3], href: "/sekbid/sekbid-4", color: "bg-ds-panel" },
          { name: sekbidNames[4], href: "/sekbid/sekbid-5", color: "bg-ds-panel" },
          { name: sekbidNames[5], href: "/sekbid/sekbid-6", color: "bg-ds-panel" },
          { name: adminName, href: "/admin", color: "bg-ds-panel" },
        ].map(({ name, href }) => (
          <Link
            key={name}
            href={href}
            className={`rounded-ds-lg shadow-ds-soft transition-all duration-200 p-5 flex flex-col items-center justify-center text-base sm:text-lg font-semibold text-ds-text-light dark:text-ds-text-dark hover:scale-[1.02]`}
          >
            <span className="text-sm text-ds-muted mb-2">{name}</span>
            <span className="text-xs text-ds-muted">{t("common.view")}</span>
          </Link>
        ))}
      </main>
      <footer className="w-full max-w-5xl text-center text-sm text-ds-muted dark:text-ds-text-dark mt-auto py-4 px-2">
        &copy; {new Date().getFullYear()} {t("home.osisName")} &mdash; OSIS Web
      </footer>
    </div>
  );
}

