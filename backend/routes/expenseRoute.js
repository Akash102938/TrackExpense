import express from 'express'
import authMiddleWare from '../middleware/auth.js'
import { addExpense, deleteExpense, downloadExpenseExcel, getAllExpense, getExpenseOverview, updateExpense } from '../controllers/expenseController.js';
const expenseRouter = express.Router();

expenseRouter.post("/add", authMiddleWare, addExpense);
expenseRouter.get("/get",authMiddleWare,getAllExpense);

expenseRouter.put("/update/:id", authMiddleWare, updateExpense);
expenseRouter.get('/downloadexcel', authMiddleWare, downloadExpenseExcel)

expenseRouter.delete("/delete/:id", authMiddleWare, deleteExpense)
expenseRouter.get("/overview", authMiddleWare, getExpenseOverview)

export default expenseRouter