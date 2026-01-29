const express = require('express');
const projectRouter  = express.Router();
const {userAuth} = require('../middlewares/authmiddleware');
const {adminAuth} = require('../middlewares/isAdmin');
const {Project} = require('../schema');
const z = require('zod');

const projectSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1)
});

/**
 * @swagger
 * /api/v1/project:
 *   post:
 *     summary: Create a new project
 *     description: Creates a new project. Only admins can create projects. Project titles must be unique per owner.
 *     tags: [Projects]
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
 *             properties:
 *               title:
 *                 type: string
 *                 description: Project title (must be unique for your projects)
 *                 example: Website Redesign Project
 *               description:
 *                 type: string
 *                 description: Detailed project description
 *                 example: Complete redesign of the company website with modern UI/UX
 *     responses:
 *       201:
 *         description: Project successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: project is added
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
 *       409:
 *         description: Duplicate project title
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Duplicate project
 *                 details:
 *                   type: string
 *                   example: You already have a project with this title
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//post add projects (admin only)
projectRouter.post('/project',userAuth,adminAuth, async function(req,res){

    try {
        const validation = projectSchema.safeParse(req.body);
        if(!validation.success){
            return res.status(400).json({error: validation.error.errors});
        }
        const {title , description} = req.body;
        
        await Project.create({
            title : title,
            description : description,
            owner : req.user.id
        })

        res.status(201).json({
            message : "project is added"
        })
    } catch (error) {
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({ 
                error: "Duplicate project",
                details: "You already have a project with this title"
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
 * /api/v1/project:
 *   get:
 *     summary: Get all projects
 *     description: Retrieve all projects with pagination. Admins see all projects. Regular users see only projects they own or are members of.
 *     tags: [Projects]
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
 *         description: Number of projects per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Successfully retrieved projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 5
 *                 total:
 *                   type: integer
 *                   description: Total number of projects
 *                   example: 47
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
//get view all projects with pagination and filtering 
projectRouter.get('/project',userAuth,async function(req,res){

    try {
        const page = parseInt(req.query.page) || 1; //get page val from url https://projects?page=1&limit=5
        const limit = parseInt(req.query.limit) || 1;
        const skip = (page-1)*limit;

        let projects;

        //admin gets all the projects + authorization
        if(req.user.role === 'admin'){
            const total = await Project.countDocuments(); //countDocuments() gets total number
                                                         //  of projects in the collection
            projects = await Project.find()
                .skip(skip) //skip the pages
                .limit(limit) //restricts the output
            
            return res.status(200).json({
                projects,
                page,
                totalPages : Math.ceil(total/limit),
                total //cnt of total projects / entries 
            });
        }else{ 
            //if not admin gets projects the user owns or 
            //projects your are member offf
            const filter = { //get rule for filtering projects 
                $or : [
                    {owner : req.user.id},
                    {members : req.user.id}
                ]
            }

            const total = await Project.countDocuments(filter); //count how many records matches this rule
            projects = await Project.find(filter)
                .skip(skip)
                .limit(limit);
            
            return res.status(200).json({
                projects,
                page,
                totalPages: Math.ceil(total / limit),
                total
            });
        }

    } catch (error) {
        res.status(500).json({ 
            error: "Internal server error",
            details: error.message
        });
    }
})

/**
 * @swagger
 * /api/v1/project/{id}:
 *   get:
 *     summary: Get project by ID
 *     description: Retrieve a specific project by its ID. Admins can view any project. Regular users can only view projects they own or are members of.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *         example: 507f1f77bcf86cd799439012
 *     responses:
 *       200:
 *         description: Successfully retrieved project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
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
 *                   example: access denied
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No project for this id
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//get view spefic project by id
projectRouter.get('/project/:id',userAuth,async function (req,res){
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);

        if(!project){
            return res.status(404).json({
                error : 'No project for this id'
            })
        }
        //if role admin access
        if(req.user.role === 'admin'){
            return res.status(200).json(project);
        }
        
        //check if owner or member belongs to project
        const isOwner = project.owner.toString() === req.user.id;
        const isMember = project.members?.includes(req.user.id);

        
        if(!isOwner && !isMember){
            return res.status(403).json({
                error : 'access denied'
            });
        }

        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ 
            error: "Internal server error",
            details: error.message
        });
    }
})


/**
 * @swagger
 * /api/v1/project/{id}:
 *   delete:
 *     summary: Delete a project
 *     description: Delete a project by its ID. Only admins can delete projects.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID to delete
 *         example: 507f1f77bcf86cd799439012
 *     responses:
 *       200:
 *         description: Project successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: project deleted
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
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: project no available
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//delete the project by id (admin only)
projectRouter.delete('/project/:id',userAuth,adminAuth,async function(req,res){
    try {
        const projectId = req.params.id;
        
        const project = await Project.findById(projectId);

        if(!project){
            return res.status(404).json({
                message : 'project no available'
            });
        }

        await Project.findByIdAndDelete(projectId);

        res.status(200).json({
            message : 'project deleted'
        })
    } catch (error) {
        res.status(500).json({ 
            error: "Internal server error",
            details: error.message
        });
    }
})

module.exports ={
    projectRouter
}
