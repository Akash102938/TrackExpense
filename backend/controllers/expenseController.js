import expenseModel from "../models/expenseModel.js";
import XLSX from "xlsx";
import getDateRange from "../utils/datafilter.js";

/* =========================
   ADD EXPENSE
========================= */
export async function addExpense(req, res) {
    try {
        const userId = req.user._id;
        const { description, amount, category, date } = req.body;

        if (!description || !amount || !category || !date) {
            return res.status(400).json({
                success: false,
                message: "All fields required",
            });
        }

        const newExpense = await expenseModel.create({
            userId,
            description,
            amount,
            category,
            date: new Date(date),
        });

        res.status(201).json({
            success: true,
            message: "Expense added successfully",
            data: newExpense,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

/* =========================
   GET ALL EXPENSE
========================= */
export async function getAllExpense(req, res) {
    try {
        const userId = req.user._id;

        const expenses = await expenseModel
            .find({ userId })
            .sort({ date: -1 });

        res.json({
            success: true,
            data: expenses,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

/* =========================
   UPDATE EXPENSE
========================= */
export async function updateExpense(req, res) {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { description, amount, category, date } = req.body;

        const updatedExpense = await expenseModel.findOneAndUpdate(
            { _id: id, userId },
            {
                ...(description && { description }),
                ...(amount && { amount }),
                ...(category && { category }),
                ...(date && { date: new Date(date) }),
            },
            { new: true }
        );

        if (!updatedExpense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found",
            });
        }

        res.json({
            success: true,
            message: "Expense updated successfully",
            data: updatedExpense,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

/* =========================
   DELETE EXPENSE
========================= */
export async function deleteExpense(req, res) {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const deletedExpense = await expenseModel.findOneAndDelete({
            _id: id,
            userId,
        });

        if (!deletedExpense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found",
            });
        }

        res.json({
            success: true,
            message: "Expense deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

/* =========================
   DOWNLOAD EXCEL
========================= */
export async function downloadExpenseExcel(req, res) {
    try {
        const userId = req.user._id;

        const expenses = await expenseModel
            .find({ userId })
            .sort({ date: -1 });

        const data = expenses.map((exp) => ({
            Description: exp.description,
            Amount: exp.amount,
            Category: exp.category,
            Date: new Date(exp.date).toLocaleDateString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

        const buffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx",
        });

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=expenses.xlsx"
        );
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

/* =========================
   EXPENSE OVERVIEW
========================= */
export async function getExpenseOverview(req, res) {
    try {
        const userId = req.user._id;
        const { range = "monthly" } = req.query;

        const { start, end } = getDateRange(range);

        const expenses = await expenseModel
            .find({
                userId,
                date: { $gte: start, $lte: end },
            })
            .sort({ date: -1 });

        const totalExpense = expenses.reduce(
            (sum, item) => sum + item.amount,
            0
        );

        const averageExpense =
            expenses.length > 0 ? totalExpense / expenses.length : 0;

        const numberOfTransactions = expenses.length;

        const recentTransactions = expenses.slice(0, 5);

        res.json({
            success: true,
            data: {
                totalExpense,
                averageExpense,
                numberOfTransactions,
                recentTransactions,
                range,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}
