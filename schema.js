const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
