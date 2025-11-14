const express=require('express')
const app=express()
const port=5000
require('dotenv').config()
const cors=require('cors')
const cookieParser = require('cookie-parser')

// Allow frontend origin and credentials for HttpOnly cookies
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173'
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }))
app.use(cookieParser())
const jwt=require('jsonwebtoken')
app.use(express.json())
app.use(express.urlencoded({extended:true}))
const connectDB=require('./connection')


const questionRoute=require('./routes/questionRoute')
const quizRoute=require('./routes/quizRoutes')
const resultRoute=require('./routes/resultRoutes')
const feedbackRoute=require('./routes/feedbackRoutes')
const authRoute=require('./routes/authRoutes')
const adminRoute=require('./routes/adminRoutes')
const aiRoute=require('./routes/aiRoutes')
connectDB()

app.use('/quizzes',quizRoute)
app.use('/questions',questionRoute)
app.use('/results',resultRoute)
app.use('/feedback',feedbackRoute)
app.use('/user',authRoute)
app.use('/admin',adminRoute)
app.use('/ai', aiRoute)

app.listen(port,()=>{
    console.log(`app is listening at ${port}`)
})