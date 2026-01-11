function adminAuth(req,res,next){
    if(req.user.role !== "admin"){
        res.json({
            errro : "you are not admin"
        })
        return;
    }
    next();
}

module.exports = {
    adminAuth
}