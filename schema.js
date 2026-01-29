const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated user ID
 *           example: 507f1f77bcf86cd799439011
 *         name:
 *           type: string
 *           description: User's full name
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address (unique)
 *           example: john@example.com
 *         password:
 *           type: string
 *           description: Hashed password
 *           example: $2b$05$hashedpassword
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *           description: User role for authorization
 *           example: user
 *     Project:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - owner
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated project ID
 *           example: 507f1f77bcf86cd799439012
 *         title:
 *           type: string
 *           description: Project title (unique per owner)
 *           example: Website Redesign
 *         description:
 *           type: string
 *           description: Project description
 *           example: Complete redesign of company website
 *         owner:
 *           type: string
 *           description: User ID of project owner
 *           example: 507f1f77bcf86cd799439011
 *         members:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who are project members
 *           example: [507f1f77bcf86cd799439013, 507f1f77bcf86cd799439014]
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - project
 *         - assignedto
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated task ID
 *           example: 507f1f77bcf86cd799439015
 *         title:
 *           type: string
 *           description: Task title
 *           example: Design homepage mockup
 *         description:
 *           type: string
 *           description: Task description
 *           example: Create initial mockup designs for homepage
 *         status:
 *           type: string
 *           enum: [todo, in_progress, done]
 *           default: todo
 *           description: Current task status
 *           example: in_progress
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           default: medium
 *           description: Task priority level
 *           example: high
 *         createdby:
 *           type: string
 *           description: User ID who created the task
 *           example: 507f1f77bcf86cd799439011
 *         project:
 *           type: string
 *           description: Project ID this task belongs to
 *           example: 507f1f77bcf86cd799439012
 *         assignedto:
 *           type: string
 *           description: User ID task is assigned to
 *           example: 507f1f77bcf86cd799439013
 *         duedate:
 *           type: string
 *           format: date
 *           description: Task due date
 *           example: 2026-02-15
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *           example: Validation failed
 *         details:
 *           type: string
 *           description: Detailed error information
 *           example: Email field is required
 */

const userSchema = new Schema({
    name : String,
    email : {type: String , unique : true},
    password : String,
    role : {
        type : String,
        enum: ["user", "admin"],
        default : "user"
    }
});

const projectSchema = new Schema({
    title : {type: String, required: true},
    description :  String,
    owner: {type:mongoose.Schema.Types.ObjectId, ref:"User"},
    members : [{type : mongoose.Schema.Types.ObjectId, ref: "User"}]
});

// Prevent duplicate project titles for the same owner
projectSchema.index({ title: 1, owner: 1 }, { unique: true });


const taskSchema = new Schema({
    title : String,

    description : String,

    status: {
        type:String,
        enum:['todo','in_progress','done'],
        default:"todo",
        index:true
    },

    priority:{type:String ,
         enum:['low','high','medium'],
          default:"medium",index:true
    },
    createdby : {type :mongoose.Schema.Types.ObjectId,
        ref : "User"
    },

    project:{
        type: mongoose.Schema.Types.ObjectId,
        ref :  "Project",
        index : true
    },

    assignedto :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        index : true
    },

    duedate:Date   
})


const User = mongoose.model("User",userSchema);
const Project = mongoose.model("Project",projectSchema);
const Task = mongoose.model("Task",taskSchema);

module.exports ={
    User,
    Project,
    Task
}
