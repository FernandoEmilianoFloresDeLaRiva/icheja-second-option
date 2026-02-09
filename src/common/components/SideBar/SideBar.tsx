import { useState, useEffect, useMemo } from "react";
import SideBarIcon from "./SideBarIcon";
import { theme } from "../../../core/config/theme";
import logo from "../../../assets/images/logo.png";
import { ROUTER_CONFIG } from "../../../core/router/ui/config/router.config";
import { NavigationItem } from "../../../core/router/domain/entities";
import { useLocation } from "wouter";

function SideBar() {
  const navigationItems = useMemo(
    () => ROUTER_CONFIG.routes.filter((i) => i instanceof NavigationItem),
    []
  );
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [location, setLocation] = useLocation();
  const [, forceUpdate] = useState({});

  // Sincronizar el estado isActive con la ruta actual
  useEffect(() => {
    let hasChanges = false;
    navigationItems.forEach((item) => {
      // Marcar como activo si la ruta coincide exactamente
      // También considerar rutas que empiezan con el path (para rutas con parámetros)
      const isCurrentRoute = location === item.path || location.startsWith(item.path + "/");
      if (item.isActive !== isCurrentRoute) {
        item.isActive = isCurrentRoute;
        hasChanges = true;
      }
    });
    // Forzar re-render solo si hubo cambios
    if (hasChanges) {
      forceUpdate({});
    }
  }, [location, navigationItems]);

  const onButtonClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    item: NavigationItem
  ) => {
    e.preventDefault();
    // No necesitamos actualizar isActive manualmente, el useEffect lo hará
    setLocation(item.path);
  };

  return (
    <div
      data-tour="sidebar"
      className={`fixed left-5 top-4 bottom-4 z-50 text-white transition-all duration-300 ease-in-out  ${
        isCollapsed ? "w-18" : "w-64"
      } flex flex-col shadow-2xl rounded-xl`}
      style={{ background: theme.colors.primary.pink }}
    >
      {/* Header/Logo */}
      <div className="flex justify-center pt-4 pb-18">
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="p-2 rounded-lg hover:bg-pink-400/30 transition-colors hover:cursor-pointer"
        >
          <SideBarIcon
            altText="logo"
            size={50}
            logoSrc={logo}
            isCollapsed={isCollapsed}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item, index) => (
          <button
            key={index}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 hover:cursor-pointer ${
              item.isActive
                ? "bg-white/20 text-white shadow-lg"
                : "hover:bg-white/10 text-pink-100 hover:text-white"
            }`}
            onClick={(e) => onButtonClick(e, item)}
          >
            <SideBarIcon
              iconName={item.label}
              size={20}
              isCollapsed={isCollapsed}
              logoSrc={item.icon}
            />
          </button>
        ))}
      </nav>
    </div>
  );
}

export default SideBar;
