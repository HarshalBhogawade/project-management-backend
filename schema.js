const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const objectid = mongoose.Types.ObjectId;

const userSchema = new Schema({
    name : String,
    email : {type: String , unique : true},
    password : String,
    role : {
        type : String,
        enum: ["user", "admin"],
        default : "user"
    }
})

const projectSchema = new Schema({
    title : String,
    description :  String,

    owner: {type:mongoose.Schema.Types.ObjectId, ref:"userSchema"},
    members : {type : mongoose.Schema.Types.ObjectId, ref: "userSchema"}
})


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

    project:{
        type: mongoose.Schema.Types.ObjectId,
        ref :  "projectSchema",
        index : true
    },

    assignedto :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "userSchema",
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
