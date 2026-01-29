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

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     description: Creates a new task and assigns it to a user. Only admins can create tasks. Prevents duplicate task assignments (same title, project, and assignedto).
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - project
 *               - assignedto
 *             properties:
 *               title:
 *                 type: string
 *                 description: Task title
 *                 example: Design homepage mockup
 *               description:
 *                 type: string
 *                 description: Detailed task description
 *                 example: Create initial mockup designs for the homepage redesign
 *               project:
 *                 type: string
 *                 description: Project ID this task belongs to
 *                 example: 507f1f77bcf86cd799439012
 *               assignedto:
 *                 type: string
 *                 description: User ID to assign the task to
 *                 example: 507f1f77bcf86cd799439013
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, done]
 *                 default: todo
 *                 description: Task status (optional)
 *                 example: todo
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Task priority (optional)
 *                 example: high
 *               duedate:
 *                 type: string
 *                 format: date
 *                 description: Task due date (optional)
 *                 example: 2026-02-15
 *     responses:
 *       201:
 *         description: Task successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: task is created
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 taskid:
 *                   type: string
 *                   description: ID of the created task
 *                   example: 507f1f77bcf86cd799439015
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
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Admin access required
 *       404:
 *         description: Project or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Project not available
 *       409:
 *         description: Duplicate task assignment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Duplicate task
 *                 details:
 *                   type: string
 *                   example: A task with this title is already assigned to this user in this project
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Get all tasks
 *     description: Retrieve all tasks with pagination and filtering. Admins see all tasks. Regular users see only tasks assigned to them or tasks in projects they are members of.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Number of tasks per page
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, done]
 *         description: Filter by task status
 *         example: in_progress
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by task priority
 *         example: high
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *         example: 507f1f77bcf86cd799439012
 *     responses:
 *       200:
 *         description: Successfully retrieved tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 8
 *                 total:
 *                   type: integer
 *                   description: Total number of tasks
 *                   example: 75
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     description: Retrieve a specific task by its ID. Admins can view any task. Regular users can only view tasks assigned to them or tasks in projects they are members of.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *         example: 507f1f77bcf86cd799439015
 *     responses:
 *       200:
 *         description: Successfully retrieved task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: You are not allowed to view this task
 *       404:
 *         description: Task or project not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: dont have task with this id
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   patch:
 *     summary: Update a task
 *     description: Update task details by its ID. Only admins can update tasks.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID to update
 *         example: 507f1f77bcf86cd799439015
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated task title
 *                 example: Design homepage mockup - revised
 *               description:
 *                 type: string
 *                 description: Updated task description
 *                 example: Create revised mockup designs with new branding
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, done]
 *                 description: Updated task status
 *                 example: in_progress
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Updated task priority
 *                 example: high
 *               assignedto:
 *                 type: string
 *                 description: Updated user ID to assign the task to
 *                 example: 507f1f77bcf86cd799439014
 *               duedate:
 *                 type: string
 *                 format: date
 *                 description: Updated task due date
 *                 example: 2026-03-01
 *     responses:
 *       200:
 *         description: Task successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task updated successfully
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Admin access required
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Task not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     description: Delete a task by its ID. Only admins can delete tasks.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID to delete
 *         example: 507f1f77bcf86cd799439015
 *     responses:
 *       200:
 *         description: Task successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Admin access required
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Task not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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