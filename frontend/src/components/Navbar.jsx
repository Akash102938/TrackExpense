import React, { useState, useRef, useEffect } from "react";
import { navbarStyles } from "../assets/dummyStyles";
import img1 from "../assets/logo.png";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { getStoredToken } from '../utils/auth.js';

const BASE_URL = 'https://trackexpense-backend-0343.onrender.com//api';

function Navbar({ user: propUser, onLogout }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  
  // ✅ Fixed: Added user state so setUser function works
  const [user, setUser] = useState(propUser || { name: "", email: "" });

  // Update internal state if propUser changes externally
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    }
  }, [propUser]);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // ✅ Fixed: Corrected API call logic
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = getStoredToken();
        if (!token) return;

        const response = await axios.get(`${BASE_URL}/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = response.data.user || response.data;
        setUser(userData);
      } catch (error) {
        console.error('Failed to load profile', error);
      }
    };

    // Only fetch if initial propUser was not provided
    if (!propUser) {
      fetchUserData();
    }
  }, [propUser]);

  const handleLogout = () => {
    setMenuOpen(false);
    localStorage.removeItem('token');
    onLogout?.();
    navigate('/login');
  };

  // Closes the toggle menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={navbarStyles.header}>
      <div className={navbarStyles.container}>
        
        {/* ✅ Logo */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center cursor-pointer"
        >
          <div className={navbarStyles.logoImage}>
            <img src={img1} alt="logo" />
          </div>
          <span className={navbarStyles.logoText}>
            Expense Tracker
          </span>
        </div>

        {/* ✅ User Section */}
        {user && (
          <div className={navbarStyles.userContainer} ref={menuRef}>
            
            {/* Button */}
            <button
              type="button"
              onClick={toggleMenu}
              className={navbarStyles.userButton}
            >
              <div className="relative">
                <div className={navbarStyles.userAvatar}>
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className={navbarStyles.statusIndicator}></div>
              </div>

              <div className={navbarStyles.userTextContainer}>
                <p className={navbarStyles.userName}>
                  {user?.name || "User"}
                </p>
                <p className={navbarStyles.userEmail}>
                  {user?.email || "user@expensetracker.com"}
                </p>
              </div>

              <ChevronDown
                className={navbarStyles.chevronIcon(menuOpen)}
              />
            </button>

            {/* ✅ Dropdown */}
            {menuOpen && (
              <div className={navbarStyles.dropdownMenu}>
                
                {/* Header */}
                <div className={navbarStyles.dropdownHeader}>
                  <div className="flex items-center gap-3">
                    <div className={navbarStyles.dropdownAvatar}>
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>

                    <div>
                      <p className={navbarStyles.dropdownName}>
                        {user?.name || "User"}
                      </p>
                      <p className={navbarStyles.dropdownEmail}>
                        {user?.email || "user@expensetracker.com"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <hr />

                {/* Menu Items */}
                <div className={navbarStyles.menuItemContainer}>
                  
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/profile");
                      setMenuOpen(false);
                    }}
                    className={navbarStyles.menuItem}
                  >
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>

                  <div className={navbarStyles.menuItemBorder}>
                    <button
                      onClick={handleLogout}
                      className={navbarStyles.logoutButton}
                    > 
                      {/* ✅ Fixed typo: className="w-4 h-4" */}
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;