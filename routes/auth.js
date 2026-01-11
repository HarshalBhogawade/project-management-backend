const { Router } = require("express");
const {User} = require('../schema');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authRouter = Router();
const {JWT_KEY} = require('../middlewares/authmiddleware')

authRouter.post('/signup',async function(req,res){
    const {name, email,password,role} = req.body;
    //do validation of the input using zod

    //do hashing of password
    const hashedPassword = await bcrypt.hash(password, 5);

    //email already exists
    const existAlready = await User.findOne({email});
    if(existAlready){
        res.json({
            error : "Email already exists"
        })
        return;
    }

    await User.create({
        name : name,
        email : email,
        password : hashedPassword,
        role : role
    });

    res.json({
        message : "Signed up"
    })
})

authRouter.post('/signin',async function(req,res){
    const {email,password}  = req.body;

    //checking if user signup is done 
    const user = await User.findOne({email});
    if(!user){
        res.json({
            error:"signup first then login"
        })
        return;
    }

    //match password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if(!passwordMatch){
        res.json({
            error : "password is incorrect"
        })
    }

    //jwt token
    const token = jwt.sign({
        id : user._id.toString(),
        role : user.role
    },JWT_KEY);

    res.json({
        success : true,
        message: "Successfull login",
        token : token
    })
})

module.exports = {
    authRouter : authRouter
}