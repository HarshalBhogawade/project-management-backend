const express = require('express');
const app = express();
const {authRouter} = require('./routes/auth');
const {projectRouter} = require('./routes/project');
const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://harshalbhogawade1_db_user:harshal2508@cluster0.cvsqrhw.mongodb.net/Project-management-app");
app.use(express.json());
app.use('/api/v1',authRouter);
app.use('/api/v1/project',projectRouter);
// app.use('/api/v1',);

app.listen(3000, () =>{
    console.log('Server is running');
})
