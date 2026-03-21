import express from 'express'
import authMiddleWare from '../middleware/auth.js'
import {addIncome, deleteIncome, downloadIncomeExcel, getAllIncome, getIncomeOverview, updateIncome} from '../controllers/incomeController.js'

const incomeRouter = express.Router();

incomeRouter.post("/add", authMiddleWare, addIncome);
incomeRouter.get("/get",authMiddleWare,getAllIncome);

incomeRouter.put("/update/:id", authMiddleWare, updateIncome);
incomeRouter.get('/downloadexcel', authMiddleWare, downloadIncomeExcel)

incomeRouter.delete("/delete/:id", authMiddleWare, deleteIncome)
incomeRouter.get("/overview", authMiddleWare, getIncomeOverview)

export default incomeRouter