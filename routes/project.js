const Router = require('express');
const projectRouter  = Router();
const {userAuth,JWT_KEY} = require('../middlewares/authmiddleware');
const {adminAuth} = require('../middlewares/isAdmin');
const {Project} = require('../schema');//document


//post add projects (admin only)
projectRouter.post('/add-project',userAuth,adminAuth, async function(req,res){
    const {title , description} = req.body;
    
    await Project.create({
        title : title,
        description : description,
        owener : req.user.id
    })

    res.json({
        message : "project is added"
    })
})
//get view all projects 
projectRouter.get('/view-projects',userAuth,async function(req,res){
    
    let projects;

    //admin gets all the projects + authorization
    if(req.user.role === 'admin'){
        projects = await Project.find();
    }else{ 
        //if not admin gets projects the user owns or 
        //projects your are member offf
        projects = await Project.find({
            $or:[{owner:req.user.id},
                  {members : req.user.id}   
                ]
        })
    }

    res.json({
        projects
    })
})

//get view spefic project by id
projectRouter.get('/view-project/:id',userAuth,async function (req,res){
    const projectId = req.params.id;
    const project = await Project.findById(projectId);

    //if role admin access
    if(req.user.role === 'admin'){
        res.json(project);
    }
    
    //check if owner or member belongs to project
    const isOwner = project.owner.toString() === req.user.id;
    const isMember = project.members?.includes(req.user.id);

    
    if(!isOwner && !isMember){
        res.json({
            error : 'access denied'
        })
    }

    res.json(project);
})


//delete the project by id (admin only)
projectRouter.delete('/delete-project/:id',userAuth,adminAuth,async function(req,res){
        const projectId = req.params.id;
        
        const project = await Project.findById(projectId);

        if(!project){
            res.json({
                message : 'project no available'
            });
        }

        await Project.findByIdAndDelete(projectId);

        res.json({
            message : 'project deleted'
        })

})

module.exports ={
    projectRouter
}