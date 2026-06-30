import React, { useRef, useState, useEffect } from "react";
import { cn, sidebarStyles } from "../assets/dummyStyles";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";

const MENU_ITEMS = [
  { text: "Dashboard", path: "/", icon: <Home size={20} /> },
  { text: "Income", path: "/income", icon: <ArrowUp size={20} /> },
  { text: "Expenses", path: "/expense", icon: <ArrowDown size={20} /> },
  { text: "Profile", path: "/profile", icon: <User size={20} /> },
];

function Sidebar({ user, isCollapsed, setIsCollapsed }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const desktopRef = useRef(null);
  const mobileRef = useRef(null);

  const [mobileOpen, setMobileOpen] = useState(false);

  const username = user?.name || "User";
  const email = user?.email || "user@example.com";
  const initial = username.charAt(0).toUpperCase();

  // lock scroll when mobile sidebar open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [mobileOpen]);

  // close mobile sidebar on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (mobileOpen && mobileRef.current && !mobileRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        ref={desktopRef}
        className={sidebarStyles.sidebarContainer.base}
        animate={{
          width: isCollapsed ? 80 : 256,
        }}
      >
        <div className={sidebarStyles.sidebarInner.base}>
          {/* Toggle */}
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className={sidebarStyles.toggleButton.base}
          >
            <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <polyline
                  points={
                    isCollapsed ? "9 18 15 12 9 6" : "15 18 9 12 15 6"
                  }
                />
              </svg>
            </motion.div>
          </button>

          {/* User */}
          <div
            className={cn(
              sidebarStyles.userProfileContainer.base,
              isCollapsed
                ? sidebarStyles.userProfileContainer.collapsed
                : sidebarStyles.userProfileContainer.expanded
            )}
          >
            <div className="flex items-center">
              <div className={sidebarStyles.userInitials.base}>
                {initial}
              </div>

              {!isCollapsed && (
                <div className="ml-3">
                  <h2 className="text-sm font-bold truncate">{username}</h2>
                  <p className="text-xs text-gray-500 truncate">{email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Menu */}
          <div className="flex-1 overflow-y-auto py-4">
            <ul className={sidebarStyles.menuList.base}>
              {MENU_ITEMS.map(({ text, path, icon }) => {
                const active = pathname === path;

                return (
                  <li key={text}>
                    <Link
                      to={path}
                      className={cn(
                        sidebarStyles.menuItem.base,
                        active
                          ? sidebarStyles.menuItem.active
                          : sidebarStyles.menuItem.inactive
                      )}
                    >
                      {icon}
                      {!isCollapsed && <span>{text}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Footer */}
          <div className={sidebarStyles.footerContainer.base}>
            <a
              href="https://hexadigital.in/contact-us/"
              target="_blank"
              rel="noreferrer"
              className={sidebarStyles.footerLink.base}
            >
              <HelpCircle size={20} />
              {!isCollapsed && <span>Support</span>}
            </a>

            <button
              onClick={handleLogout}
              className={sidebarStyles.logoutButton.base}
            >
              <LogOut size={20} />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen((prev) => !prev)}
        className={sidebarStyles.mobileMenuButton}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className={sidebarStyles.mobileOverlay}>
            <div
              className={sidebarStyles.mobileBackdrop}
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              ref={mobileRef}
              className={sidebarStyles.mobileSidebar.base}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
            >
              {/* Header */}
              <div className={sidebarStyles.mobileHeader}>
                <div className="flex items-center gap-3">
                  <div className={sidebarStyles.userInitials.base}>
                    {initial}
                  </div>
                  <div>
                    <h2 className="font-bold">{username}</h2>
                    <p className="text-sm text-gray-500">{email}</p>
                  </div>
                </div>

                <button onClick={() => setMobileOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              {/* Menu */}
              <ul className={sidebarStyles.mobileMenuList}>
                {MENU_ITEMS.map(({ text, path, icon }) => (
                  <li key={text}>
                    <Link
                      to={path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        sidebarStyles.mobileMenuItem.base,
                        pathname === path
                          ? sidebarStyles.mobileMenuItem.active
                          : sidebarStyles.mobileMenuItem.inactive
                      )}
                    >
                      {icon}
                      <span>{text}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className={sidebarStyles.mobileFooter}>
                <a
                  href="https://hexadigital.in/contact-us/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <HelpCircle size={20} />
                  <span>Support</span>
                </a>

                <button onClick={handleLogout}>
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
