/**
 * @file Income.jsx
 * @description Page component for managing and visualizing income data in a financial tracking app.
 * Features:
 *  - Displays KPI summary cards (Total Income, Average Income, Transaction Count).
 *  - Renders a interactive bar chart (Recharts) showing income trends over various timeframes.
 *  - Filters transactions by category and date ranges.
 *  - Supports CRUD operations (Create, Read, Update, Delete) for income entries via REST API.
 *  - Exports transaction data to Excel with client-side fallback.
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Plus,
  DollarSign,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  Filter,
  BarChart2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import axios from "axios";
import { exportToExcel } from "../utils/exportUtils";
import AddTransactionModal from "../components/Add";
import TransactionItem from "../components/TransactionItem";
import TimeFrameSelector from "../components/TimeFrame";
import FinancialCard from "../components/FinancialCard";
import { getTimeFrameRange, generateChartPoints } from "../components/Helper";
import { INCOME_COLORS, CATEGORY_ICONS_Inc } from "../assets/color";
import { incomeStyles as styles } from "../assets/dummyStyles";
import { getAuthHeaders as getAuthHeadersFromStorage } from "../utils/auth";

// Base URL for API requests
const API_BASE = "https://trackexpense-backend-0343.onrender.com//api";

/**
 * Converts a raw date input or 'YYYY-MM-DD' string to an ISO string, 
 * preserving local system time for date-only inputs.
 * 
 * @param {string|Date} dateValue - Date input string or Date object
 * @returns {string} ISO date string
 */
function toIsoWithClientTime(dateValue) {
  if (!dateValue) {
    return new Date().toISOString();
  }

  // If a 10-character YYYY-MM-DD string is passed, attach local system time
  if (typeof dateValue === "string" && dateValue.length === 10) {
    const now = new Date();
    const hhmmss = now.toTimeString().slice(0, 8);
    const combined = new Date(`${dateValue}T${hhmmss}`);
    return combined.toISOString();
  }

  try {
    return new Date(dateValue).toISOString();
  } catch (err) {
    return new Date().toISOString();
  }
}

/**
 * IncomeChart Component
 * Renders a responsive bar chart using Recharts to visualize income trends across time points.
 * 
 * @param {Object} props
 * @param {Array} props.chartData - Formatted data points for the bar chart
 * @param {string} props.timeFrame - Active timeframe ('daily', 'weekly', 'monthly', 'yearly')
 * @param {Object} props.timeFrameRange - Start, end dates and label for the range
 */
const IncomeChart = ({ chartData, timeFrame, timeFrameRange }) => (
  <div className={styles.chartContainer}>
    {/* Chart Title & Subtitle Header */}
    <div className={styles.chartHeaderContainer}>
      <h3 className={styles.chartTitle}>
        <BarChart2 className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
        {timeFrame === "daily"
          ? "Hourly"
          : timeFrame === "yearly"
            ? "Monthly"
            : "Daily"}{" "}
        Income Trends
        <span className="text-sm text-gray-500 font-normal">
          {" "}
          ({timeFrameRange.label})
        </span>
      </h3>
    </div>

    {/* Recharts BarChart Container */}
    <div className={styles.chartHeight}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
        >
          {/* Bar Gradient Definition */}
          <defs>
            <linearGradient id="incomeBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f3f4f6"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            width={50}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            formatter={(value) => [
              `$${Math.round(value).toLocaleString()}`,
              "Income",
            ]}
            contentStyle={styles.tooltipContent}
          />

          {/* Render individual bars with distinct colors */}
          <Bar
            dataKey="income"
            name="Income"
            radius={[6, 6, 0, 0]}
            barSize={20}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={INCOME_COLORS[index % INCOME_COLORS.length]}
              />
            ))}
          </Bar>

          {/* Highlight current active period with vertical reference lines */}
          {chartData.map(
            (point, index) =>
              point.isCurrent && (
                <ReferenceLine
                  key={index}
                  x={point.label}
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              ),
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

/**
 * FilterSection Component
 * Controls category/timeframe drop-down filtering and exports transaction data.
 * 
 * @param {Object} props
 * @param {string} props.filter - Current filter selection
 * @param {Function} props.setFilter - State setter for filter value
 * @param {Function} props.handleExport - Click handler to initiate Excel download
 */
const FilterSection = ({ filter, setFilter, handleExport }) => (
  <div className={styles.filterContainer}>
    {/* Dropdown Selector */}
    <div className="relative w-full sm:w-auto">
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className={styles.filterSelect}
      >
        <option value="all">All Transactions</option>
        <option value="month">This Month</option>
        <option value="year">This Year</option>
        <option value="Salary">Salary</option>
        <option value="Freelance">Freelance</option>
        <option value="Investment">Investment</option>
        <option value="Bonus">Bonus</option>
        <option value="Other">Other</option>
      </select>
      <Filter className={styles.filterIcon} />
    </div>

    {/* Export Button */}
    <button onClick={handleExport} className={styles.exportButton}>
      <Download size={16} className="md:size-4" /> Export
    </button>
  </div>
);

/**
 * Main Income Page Component
 * Handles data context integration, local filtering, chart generation, metrics overview, and CRUD handlers.
 */
const Income = () => {
  // Shared global context provided by parent layout
  const {
    transactions: outletTransactions = [],
    timeFrame = "monthly",
    setTimeFrame = () => {},
    refreshTransactions,
  } = useOutletContext();

  // Local UI & state management
  const [showModal, setShowModal] = useState(false);             // Add-modal toggle
  const [editingId, setEditingId] = useState(null);               // Track item currently being edited
  const [showAll, setShowAll] = useState(false);                 // Toggle full transaction list
  const [filter, setFilter] = useState("all");                   // Category/Date filter criteria
  const [loading, setLoading] = useState(false);                 // Network action loading indicator

  // Server-driven summary overview metrics
  const [overview, setOverview] = useState({
    totalIncome: 0,
    averageIncome: 0,
    numberOfTransactions: 0,
    recentTransactions: [],
    range: "monthly",
  });

  // State for adding new transactions
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "income",
    category: "Salary",
  });

  // State for updating an existing transaction inline
  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
    category: "Salary",
    date: new Date().toISOString().split("T")[0],
  });

  // Fetch authorization headers from helper utility
  const getAuthHeaders = useCallback(
    () => getAuthHeadersFromStorage(),
    []
  );

  // Calculate current timeframe range boundaries (start date, end date, label)
  const timeFrameRange = useMemo(
    () => getTimeFrameRange(timeFrame, null),
    [timeFrame],
  );

  // Generate blank data points for the selected timeframe chart
  const chartPoints = useMemo(
    () => generateChartPoints(timeFrame, timeFrameRange),
    [timeFrame, timeFrameRange],
  );

  /**
   * Helper function to check if a target date falls inside start and end boundaries (inclusive).
   */
  const isDateInRange = useCallback((date, start, end) => {
    const transactionDate = new Date(date);
    const startDate = new Date(start);
    const endDate = new Date(end);

    transactionDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return transactionDate >= startDate && transactionDate <= endDate;
  }, []);

  // Filter outlet context transactions specifically for "income" items sorted newest to oldest
  const incomeTransactions = useMemo(
    () =>
      (outletTransactions || [])
        .filter((t) => t.type === "income")
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [outletTransactions],
  );

  // Filter income transactions to match active timeframe boundaries
  const timeFrameTransactions = useMemo(
    () =>
      incomeTransactions.filter((t) =>
        isDateInRange(t.date, timeFrameRange.start, timeFrameRange.end),
      ),
    [incomeTransactions, timeFrameRange, isDateInRange],
  );

  // Apply sub-filters (e.g., category name, specific month/year)
  const filteredTransactions = useMemo(() => {
    if (filter === "all") return timeFrameTransactions;

    return timeFrameTransactions.filter((t) => {
      if (filter === "month" || filter === "year") {
        const transDate = new Date(t.date);
        if (filter === "month") {
          return (
            transDate.getMonth() === timeFrameRange.start.getMonth() &&
            transDate.getFullYear() === timeFrameRange.start.getFullYear()
          );
        }
        if (filter === "year") {
          return transDate.getFullYear() === timeFrameRange.start.getFullYear();
        }
      }
      return t.category.toLowerCase() === filter.toLowerCase();
    });
  }, [timeFrameTransactions, filter, timeFrameRange]);

  // Map filtered transactions onto predefined chart data points for visual display
  const chartData = useMemo(() => {
    const data = chartPoints.map((point) => ({ ...point, income: 0 }));

    filteredTransactions.forEach((transaction) => {
      const transDate = new Date(transaction.date);
      const point = data.find((d) =>
        timeFrame === "daily"
          ? d.hour === transDate.getHours()
          : timeFrame === "yearly"
            ? d.date.getMonth() === transDate.getMonth()
            : d.date.getDate() === transDate.getDate() &&
              d.date.getMonth() === transDate.getMonth(),
      );
      point && (point.income += Math.round(Number(transaction.amount)));
    });

    return data;
  }, [filteredTransactions, chartPoints, timeFrame]);

  // Fetch overview metadata directly from backend endpoint
  const fetchOverview = useCallback(
    async (range = timeFrame ?? "monthly") => {
      try {
        const res = await axios.get(`${API_BASE}/income/overview`, {
          headers: getAuthHeaders(),
          params: { range },
        });

        if (res.data?.success) {
          const payload = res.data.data ?? {};
          setOverview({
            totalIncome: payload.totalIncome ?? 0,
            averageIncome: payload.averageIncome ?? 0,
            numberOfTransactions: payload.numberOfTransactions ?? 0,
            recentTransactions: payload.recentTransactions ?? [],
            range: payload.range ?? range,
          });
        }
      } catch (err) {
        console.error("Failed to fetch overview:", err);
      }
    },
    [timeFrame, getAuthHeaders],
  );

  // Refresh overview whenever timeframe changes
  useEffect(() => {
    fetchOverview(timeFrame ?? "monthly");
  }, [fetchOverview, timeFrame]);

  // Derived metric: Fallback client calculation if backend value is null
  const totalIncome = useMemo(
    () =>
      overview.totalIncome ??
      filteredTransactions.reduce(
        (sum, t) => sum + Math.round(Number(t.amount || 0)),
        0,
      ),
    [overview.totalIncome, filteredTransactions],
  );

  // Derived metric: Calculate average transaction amount
  const averageIncome = useMemo(
    () =>
      overview.averageIncome
        ? Math.round(overview.averageIncome)
        : filteredTransactions.length
          ? Math.round(
              filteredTransactions.reduce(
                (s, t) => s + Math.round(Number(t.amount || 0)),
                0,
              ) / filteredTransactions.length,
            )
          : 0,
    [overview.averageIncome, filteredTransactions],
  );

  // Derived metric: Transaction count
  const transactionsCount = useMemo(
    () => overview.numberOfTransactions ?? filteredTransactions.length,
    [overview.numberOfTransactions, filteredTransactions],
  );

  /**
   * Action Handler: Create a new income record
   */
  const handleAddTransaction = useCallback(async () => {
    if (!newTransaction.description || !newTransaction.amount) return;

    try {
      setLoading(true);

      const payload = {
        description: newTransaction.description.trim(),
        amount: parseFloat(newTransaction.amount),
        category: newTransaction.category,
        date: toIsoWithClientTime(newTransaction.date),
      };

      await axios.post(`${API_BASE}/income/add`, payload, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });

      // Refresh both global transaction state and local overview data
      await refreshTransactions();
      await fetchOverview(timeFrame ?? "monthly");

      // Reset form state and close modal
      setNewTransaction({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        type: "income",
        category: "Salary",
      });
      setShowModal(false);
    } catch (err) {
      console.error("Add income error:", err);
      const serverMsg = err?.response?.data?.message;
      alert(serverMsg || "Server error while adding income.");
    } finally {
      setLoading(false);
    }
  }, [
    newTransaction,
    getAuthHeaders,
    refreshTransactions,
    fetchOverview,
    timeFrame,
  ]);

  /**
   * Action Handler: Update an existing income transaction
   */
  const handleEditTransaction = useCallback(async () => {
    if (!editingId || !editForm.description || !editForm.amount) return;

    try {
      setLoading(true);

      const payload = {
        description: editForm.description.trim(),
        amount: parseFloat(editForm.amount),
        category: editForm.category,
        date: toIsoWithClientTime(editForm.date),
      };

      await axios.put(`${API_BASE}/income/update/${editingId}`, payload, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });

      await refreshTransactions();
      await fetchOverview(timeFrame ?? "monthly");

      setEditingId(null);
    } catch (err) {
      console.error("Update income error:", err);
      const serverMsg = err?.response?.data?.message;
      alert(serverMsg || "Server error while updating income.");
    } finally {
      setLoading(false);
    }
  }, [
    editingId,
    editForm,
    getAuthHeaders,
    refreshTransactions,
    fetchOverview,
    timeFrame,
  ]);

  /**
   * Action Handler: Delete a selected transaction by ID
   */
  const handleDeleteTransaction = useCallback(
    async (id) => {
      if (!id) return;
      if (!window.confirm("Are you sure you want to delete this income?"))
        return;

      try {
        setLoading(true);
        await axios.delete(`${API_BASE}/income/delete/${id}`, {
          headers: getAuthHeaders(),
        });

        await refreshTransactions();
        await fetchOverview(timeFrame ?? "monthly");
      } catch (err) {
        console.error("Delete income error:", err);
        const serverMsg = err?.response?.data?.message;
        alert(serverMsg || "Server error while deleting income.");
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders, refreshTransactions, fetchOverview, timeFrame],
  );

  /**
   * Action Handler: Export records to Excel file via API blob download or client fallback
   */
  const handleExport = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/income/downloadexcel`, {
        headers: getAuthHeaders(),
        responseType: "blob",
      });

      // Handle raw stream blob download
      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/octet-stream",
      });
      const disposition = res.headers["content-disposition"];
      let filename = "income_details.xlsx";
      if (disposition) {
        const match = disposition.match(/filename="?(.+)"?/);
        if (match && match[1]) filename = match[1];
      }
      
      // Trigger invisible anchor tag download
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export error:", err);
      // Fallback: Client-side CSV/Excel export using utility if backend fails
      try {
        const exportData = filteredTransactions.map((t) => ({
          Date: new Date(t.date).toLocaleDateString(),
          Description: t.description,
          Category: t.category,
          Amount: t.amount,
          Type: "Income",
        }));
        exportToExcel(
          exportData,
          `income_${new Date().toISOString().slice(0, 10)}`,
        );
      } catch (e) {
        console.error("Fallback export failed:", e);
        alert("Failed to export data.");
      }
    }
  }, [getAuthHeaders, filteredTransactions]);

  return (
    <div className={styles.wrapper}>
      {/* --- PAGE HEADER & TIMEFRAME SELECTOR --- */}
      <div className={styles.headerContainer}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>Income Overview</h1>
            <p className={styles.headerSubtitle}>
              Track and manage your income sources
            </p>
          </div>
          {/* Add Income Button */}
          <button
            onClick={() => setShowModal(true)}
            className={styles.addButton}
            disabled={loading}
          >
            <Plus size={18} className="md:size-5" />{" "}
            {loading ? "Processing..." : "Add Income"}
          </button>
        </div>

        {/* Timeframe Selector Component (Daily, Weekly, Monthly, Yearly) */}
        <div className={styles.timeFrameContainer}>
          <TimeFrameSelector
            timeFrame={timeFrame}
            setTimeFrame={setTimeFrame}
            options={["daily", "weekly", "monthly", "yearly"]}
            color="teal"
          />
        </div>
      </div>

      {/* --- FINANCIAL SUMMARY KPI CARDS --- */}
      <div className={styles.summaryGrid}>
        {/* Card 1: Total Income */}
        <FinancialCard
          icon={
            <div className={styles.iconGreen}>
              <DollarSign
                className={`w-4 h-4 md:w-5 md:h-5 ${styles.textGreen}`}
              />
            </div>
          }
          label="Total Income"
          value={`$${Number(totalIncome || 0).toLocaleString()}`}
          additionalContent={
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> {timeFrameRange.label}
            </div>
          }
        />

        {/* Card 2: Average Income per transaction */}
        <FinancialCard
          icon={
            <div className={styles.iconBlue}>
              <BarChart2
                className={`w-4 h-4 md:w-5 md:h-5 ${styles.textBlue}`}
              />
            </div>
          }
          label="Average Income"
          value={`$${Number(averageIncome || 0).toLocaleString()}`}
          additionalContent={
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> {transactionsCount}{" "}
              transactions
            </div>
          }
        />

        {/* Card 3: Total Transaction Count */}
        <FinancialCard
          icon={
            <div className={styles.iconPurple}>
              <TrendingUp
                className={`w-4 h-4 md:w-5 md:h-5 ${styles.textPurple}`}
              />
            </div>
          }
          label="Transactions"
          value={transactionsCount}
          additionalContent={
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {filter === "all" ? "All records" : "Filtered records"}
            </div>
          }
        />
      </div>

      {/* --- INCOME TRENDS BAR CHART --- */}
      <IncomeChart
        chartData={chartData}
        timeFrame={timeFrame}
        timeFrameRange={timeFrameRange}
      />

      {/* --- TRANSACTION LIST & FILTER SECTION --- */}
      <div className={styles.listContainer}>
        <div className={styles.header}>
          <h3 className={styles.sectionTitle}>
            <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
            Income Transactions
            <span className="text-sm text-gray-500 font-normal">
              {" "}
              ({timeFrameRange.label})
            </span>
          </h3>

          {/* Category Dropdown & Export Action */}
          <FilterSection
            filter={filter}
            setFilter={setFilter}
            handleExport={handleExport}
          />
        </div>

        {/* Render Transaction Items */}
        <div className={styles.transactionList}>
          {filteredTransactions
            .slice(0, showAll ? filteredTransactions.length : 8)
            .map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                isEditing={editingId === transaction.id}
                editForm={editForm}
                setEditForm={setEditForm}
                onSave={handleEditTransaction}
                onCancel={() => setEditingId(null)}
                onDelete={handleDeleteTransaction}
                type="income"
                categoryIcons={CATEGORY_ICONS_Inc}
                setEditingId={setEditingId}
              />
            ))}

          {/* View All Button (When items exceed default limit of 8) */}
          {!showAll && filteredTransactions.length > 8 && (
            <button
              onClick={() => setShowAll(true)}
              className={styles.viewAllButton}
            >
              <Eye size={18} /> View All {filteredTransactions.length}{" "}
              Transactions
            </button>
          )}

          {/* Empty State View */}
          {filteredTransactions.length === 0 && (
            <div className={styles.emptyStateContainer}>
              <div className={styles.emptyStateIcon}>
                <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
              </div>
              <p className={styles.emptyStateText}>
                No income transactions found
              </p>
              <p className={styles.emptyStateSubtext}>
                {filter === "all"
                  ? "You haven't recorded any income yet"
                  : `No ${filter} transactions found`}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className={styles.emptyStateButton}
              >
                <Plus size={16} className="md:size-5" /> Add Income
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- ADD TRANSACTION MODAL --- */}
      <AddTransactionModal
        showModal={showModal}
        setShowModal={setShowModal}
        newTransaction={newTransaction}
        setNewTransaction={setNewTransaction}
        handleAddTransaction={handleAddTransaction}
        loading={loading}
        type="income"
        title="Add New Income"
        buttonText="Add Income"
        categories={["Salary", "Freelance", "Investment", "Bonus", "Other"]}
        color="teal"
      />
    </div>
  );
};

export default Income;