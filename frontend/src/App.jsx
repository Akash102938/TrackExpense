import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Income from "./pages/Income";
import Expense from "./pages/Expense";
import Profile from "./pages/Profile";

const API_URL = "http://localhost:4000";

// Get transactions from localStorage
const getTransactionsFromStorage = () => {
  const saved = localStorage.getItem("transactions");
  return saved ? JSON.parse(saved) : [];
};

// Protected Route
const ProtectedRoute = ({ user, children }) => {
  const hasToken =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (!user || !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Scroll to top on route change
const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
};

function App() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [transactions, setTransactions] = useState(
    getTransactionsFromStorage()
  );
  const [isLoading, setIsLoading] = useState(true);

  // Save transactions whenever changed
  useEffect(() => {
    localStorage.setItem(
      "transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  // Load auth data on app start
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const localUser = localStorage.getItem("user");
        const sessionUser = sessionStorage.getItem("user");

        const localToken = localStorage.getItem("token");
        const sessionToken = sessionStorage.getItem("token");

        const storedUser = localUser
          ? JSON.parse(localUser)
          : sessionUser
          ? JSON.parse(sessionUser)
          : null;

        const storedToken = localToken || sessionToken;

        if (storedUser && storedToken) {
          setUser(storedUser);
          setToken(storedToken);
          return;
        }

        if (storedToken) {
          try {
            const response = await axios.get(
              `${API_URL}/api/user/me`,
              {
                headers: {
                  Authorization: `Bearer ${storedToken}`,
                },
              }
            );

            const profile = response.data?.user || response.data;

            setUser(profile);
            setToken(storedToken);
          } catch (error) {
            console.error("Token validation failed:", error);
            clearAuth();
          }
        }
      } catch (error) {
        console.error("Auth load error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  // Save login/signup auth
  const persistAuth = (
    userData,
    tokenData,
    remember = false
  ) => {
    if (remember) {
      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );
      localStorage.setItem("token", tokenData);

      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    } else {
      sessionStorage.setItem(
        "user",
        JSON.stringify(userData)
      );
      sessionStorage.setItem("token", tokenData);

      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }

    setUser(userData);
    setToken(tokenData);
  };

  // Logout
  const clearAuth = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");

    setUser(null);
    setToken(null);
  };

  const handleLogin = (
    userData,
    remember = false,
    tokenData = null
  ) => {
    persistAuth(userData, tokenData, remember);
    navigate("/");
  };

  const handleSignup = (
    userData,
    remember = false,
    tokenData = null
  ) => {
    persistAuth(userData, tokenData, remember);
    navigate("/");
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  // FIXED: Handler for updating user profile state and storage
  const handleUpdateProfile = (updatedUser) => {
    setUser(updatedUser);
    if (localStorage.getItem("token")) {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } else {
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  // Transaction helpers
  const addTransaction = (transaction) => {
    setTransactions((prev) => [transaction, ...prev]);
  };

  const editTransaction = (id, updatedTransaction) => {
    setTransactions((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...updatedTransaction, id }
          : item
      )
    );
  };

  const deleteTransaction = (id) => {
    setTransactions((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  const refreshTransactions = () => {
    setTransactions(getTransactionsFromStorage());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={<Login onLogin={handleLogin} />}
        />

        <Route
          path="/signup"
          element={<Signup onSignup={handleSignup} />}
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute user={user}>
              <Layout
                user={user}
                onLogout={handleLogout}
                transactions={transactions}
                addTransaction={addTransaction}
                editTransaction={editTransaction}
                deleteTransaction={deleteTransaction}
                refreshTransactions={refreshTransactions}
              />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={
              <Dashboard
                user={user}
                transactions={transactions}
                addTransaction={addTransaction}
                editTransaction={editTransaction}
                deleteTransaction={deleteTransaction}
                refreshTransactions={refreshTransactions}
              />
            }
          />

          <Route
            path="/income"
            element={
              <Income
                transactions={transactions}
                addTransaction={addTransaction}
                editTransaction={editTransaction}
                deleteTransaction={deleteTransaction}
                refreshTransactions={refreshTransactions}
              />
            }
          />

          <Route
            path="/expense"
            element={
              <Expense
                transactions={transactions}
                addTransaction={addTransaction}
                editTransaction={editTransaction}
                deleteTransaction={deleteTransaction}
                refreshTransactions={refreshTransactions}
              />
            }
          />

          {/* FIXED: Corrected prop names and passed handler */}
          <Route 
            path="/profile" 
            element={
              <Profile 
                user={user} 
                onUpdateProfile={handleUpdateProfile} 
                onLogout={handleLogout}
              />
            }
          />
        </Route>

        {/* FIXED: Replaced '+' with '*' for catch-all route */}
        <Route 
          path="*" 
          element={<Navigate to={user ? '/' : "/login"} replace />}
        />
      </Routes>
    </>
  );
}

export default App;