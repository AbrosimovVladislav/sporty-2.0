import { BottomTabs, type Tab } from "@/components/BottomTabs";
import { HomeIcon, SearchIcon, ShieldIcon, UserIcon } from "@/components/Icons";
import { UIChromeProvider } from "@/components/ui/UIChromeContext";
import { CityProvider } from "@/lib/city-context";

const globalTabs: Tab[] = [
  { label: "Главная",     href: "/home",    icon: <HomeIcon /> },
  { label: "Моя команда", href: "/teams",   icon: <ShieldIcon />, matchPaths: ["/team"] },
  { label: "Поиск",       href: "/search",  icon: <SearchIcon /> },
  { label: "Профиль",     href: "/profile", icon: <UserIcon /> },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CityProvider>
      <UIChromeProvider>
        <div
          className="flex flex-col flex-1"
          style={{
            paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {children}
          <BottomTabs tabs={globalTabs} />
        </div>
      </UIChromeProvider>
    </CityProvider>
  );
}
