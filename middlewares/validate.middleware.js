const AppError = require('../utils/AppError');
const validate = (schema)=>(req,res,next)=>{
    const {error , value} = schema.validate(req.body,{
        abortEarly : false,
        stripUnknown : true
    });
    if(error){
        return next(
            new AppError(
                "validation Error",
                400,
                error.details.map((err)=>err.message)
            )
        );
    }
    req.body = value;
    next();
}

module.exports = validate;