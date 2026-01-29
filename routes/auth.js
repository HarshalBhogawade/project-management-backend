const express = require("express");
const {User} = require('../schema');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const z = require('zod');
const authRouter = express.Router();
const JWT_KEY = process.env.JWT_KEY || "Key";

const signupSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["user", "admin"]).optional()
});

const signinSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

/**
 * @swagger
 * /api/v1/signup:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with hashed password. Email must be unique.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (must be unique)
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User password (minimum 6 characters)
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
 *                 description: User role (optional, defaults to 'user')
 *                 example: user
 *     responses:
 *       201:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Signed up
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
 *                   items:
 *                     type: object
 *                   example: [{"code": "too_small", "minimum": 6, "type": "string", "path": ["password"], "message": "String must contain at least 6 character(s)"}]
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email already exists
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.post('/signup',async function(req,res){
    try {
        const validation = signupSchema.safeParse(req.body);
        if(!validation.success){
            return res.status(400).json({error: validation.error.errors});
        }
        const {name, email,password,role} = req.body;
        //do validation of the input using zod

        //do hashing of password
        const hashedPassword = await bcrypt.hash(password, 5);

        //email already exists
        const existAlready = await User.findOne({email});
        if(existAlready){
            return res.status(409).json({
                error : "Email already exists"
            });
        }

        await User.create({
            name : name,
            email : email,
            password : hashedPassword,
            role : role
        });

        res.status(201).json({
            message : "Signed up"
        })
    } catch (error) {
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({ 
                error: "Email already exists",
                details: "This email is already registered"
            });
        }
        res.status(500).json({ 
            error: "Internal server error",
            details: error.message
        });
    }
})

/**
 * @swagger
 * /api/v1/signin:
 *   post:
 *     summary: User login
 *     description: Authenticates user credentials and returns a JWT token for authorization
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's registered email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Successfull login
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjE4OTIzMDAwfQ.Abc123xyz
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: password is incorrect
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: signup first then login
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.post('/signin',async function(req,res){
    try {
        const validation = signinSchema.safeParse(req.body);
        if(!validation.success){
            return res.status(400).json({error: validation.error.errors});
        }
        const {email,password}  = req.body;

        //checking if user signup is done 
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({
                error:"signup first then login"
            });
        }

        //match password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if(!passwordMatch){
            return res.status(401).json({
                error : "password is incorrect"
            });
        }

        //jwt token
        const token = jwt.sign({
            id : user._id.toString(),
            role : user.role
        }, JWT_KEY);

        res.status(200).json({
            success : true,
            message: "Successfull login",
            token : token
        })
    } catch (error) {
        res.status(500).json({ 
            error: "Internal server error",
            details: error.message
        });
    }
})

module.exports = {
    authRouter : authRouter
}