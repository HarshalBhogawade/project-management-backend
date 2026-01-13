const express = require('express');
const taskRouter = express.Router();
const { Project, User, Task } = require('../schema');
const { userAuth } = require('../middlewares/authmiddleware');
const {adminAuth} = require('../middlewares/isAdmin');
const z = require('zod');


const taskSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    project: z.string().min(1),
    assignedto: z.string().min(1),
    status: z.enum(["todo", "in_progress", "done"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    duedate: z.string().optional()
});

//post - add task
taskRouter.post('/tasks', userAuth, adminAuth, async function (req, res) {
    try {
        const validation = taskSchema.safeParse(req.body);
        if(!validation.success){
            return res.status(400).json({error: validation.error.errors});
        }
        const { title, description, status, priority, project, assignedto, duedate } = req.body;

        //finding if project available for given project id
        const findProject = await Project.findById(project);
        if (!findProject) {
            return res.status(404).json({
                error: 'Project not available'
            });
        }

        //getting user we assigned taskto
        const finduser = await User.findById(assignedto);
        if (!finduser) {
            return res.status(404).json({
                error: 'user not available to which task assigned to'
            });
        }

        // Check for duplicate task assignment (same title, project, and assignedto)
        const existingTask = await Task.findOne({
            title: title,
            project: project,
            assignedto: assignedto
        });
        if (existingTask) {
            return res.status(409).json({
                error: 'Duplicate task',
                details: 'A task with this title is already assigned to this user in this project'
            });
        }

        const taskid = await Task.create({
            title: title,
            description: description,
            status: status,
            priority: priority,
            project: project,
            createdby: req.user.id,
            assignedto: assignedto,
            duedate: duedate
        });

        res.status(201).json({
            message: 'task is created',
            success: true,
            taskid: taskid._id
        })
    } catch (error) {
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({ 
                error: "Duplicate entry",
                details: "This entry already exists"
            });
        }
        res.status(500).json({ 
            error: "Internal server error",
            details: error.message
        });
    }
})

//get view task
taskRouter.get('/tasks', userAuth, async function (req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1;
        const skip = (page-1) * limit;


        //filtering
        const {status , priority, project} = req.query;
        let filter  = {};

        // ADMIN: can see every task
        if (req.user.role === 'admin') {
            if(status) filter.status = status;
            if(priority) filter.priority = priority;
            if(project) filter.project = project;

        } else {
            // USER: find projects where user is a member
            const projects = await Project.find({
                members: req.user.id
            }).select('_id');

            // extract project ids for task query
            const projectIds = projects.map(p => p._id);

            filter.$or= [
                {assignedto : req.user.id},
                {project : { $in:projectIds } }
            ]
            
            if(status) filter.status = status;
            if(priority) filter.priority = priority;
            if(project) filter.project = project;

        }
        const total = await Task.countDocuments(filter);
        const tasks = await Task.find(filter)
            .skip(skip)
            .limit(limit);

        res.status(200).json({ 
            tasks,
            page,
            totalPages: Math.ceil(total / limit),
            total
        });

    } catch (error) {
        res.status(500).json({ 
            error: "Internal server error",
            details: error.message
        });
    }
})

//view task by id
taskRouter.get('/tasks/:id', userAuth, async function (req, res) {
    try {
        const taskId = req.params.id;

        //get task 
        const task = await Task.findById(taskId);
        if (!task) { //if not task throw error
            return res.status(404).json({
                error: 'dont have task with this id'
            })
        }

        //if admin no more verification needed
        if (req.user.role === 'admin') {
            return res.status(200).json(task);
        }

        //if user then only can view task assigned to them
        if (task.assignedto.toString() === req.user.id) {
            return res.status(200).json(task);
        }


        //user members of project can access its task
        const project = await Project.findById(task.project);
        if (!project) {
            return res.status(404).json({
                error: 'Project not found'
            });
        }

        const isMember = project.members && project.members.length > 0 &&
            project.members.map(id => id.toString()).includes(req.user.id);

        if (isMember) {
            return res.status(200).json(task);
        }

        return res.status(403).json({
            error: 'You are not allowed to view this task'
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Internal server error",
            details: error.message
        });
    }
})

//patch update task (admin only)
taskRouter.patch('/tasks/:id', userAuth, adminAuth, async function (req, res) {
    try {
        const taskId = req.params.id;
        const updates = req.body;

        //get task
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        //update task
        const updatedTask = await Task.findByIdAndUpdate(taskId, updates, { new: true });

        res.status(200).json({
            message: 'Task updated successfully',
            task: updatedTask
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Internal server error",
            details: error.message
        });
    }
});

//delete task - only can be admin
taskRouter.delete('/tasks/:id', userAuth, adminAuth, async function (req, res) {
    try {
        const taskId = req.params.id;

        //get task
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        //delete task
        await Task.findByIdAndDelete(taskId);

        res.status(200).json({
            message: 'Task deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Internal server error",
            details: error.message
        });
    }
});

module.exports = {
    taskRouter
}