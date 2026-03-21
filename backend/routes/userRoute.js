import express from 'express'
import {registerUser,loginUser, getCurrentUser, updateProfile, updatePassword} from '../controllers/userController.js'
import authMiddleWare from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser)
userRouter.post('/login',loginUser)

//protected Routes
userRouter.get('/me', authMiddleWare, getCurrentUser)
userRouter.put('/profile', authMiddleWare,updateProfile )
userRouter.put('/password', authMiddleWare, updatePassword)

export default userRouter