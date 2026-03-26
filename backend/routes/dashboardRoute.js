import express from 'express'

import { getDashboardOverview } from '../controllers/dashboardController.js'
import authMiddleWare from '../middleware/auth.js'

const dashboardRouter = express.Router();

dashboardRouter.get('/', authMiddleWare, getDashboardOverview)

export default dashboardRouter
