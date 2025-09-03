const {Schema , model} = require('mongoose');
const {createHmac , randomBytes} = require('crypto');
const userSchema = new Schema({
    fullName : {
        type : String , 
        required : true
    }, 
    email : {
        type : String ,
        required : true ,
        unique : true
    },
    salt : {
        type : String ,
  
    },
    password : {
        type : String ,
        required : true ,
    },
    profilePicUrl : {
        type : String ,
        default : "/images/defprof.jpg"
    },
    role :{
        type : String ,
        enum : ["ADMIN" , "USER"] , 
        default : "USER"
    },

} , {timestamps : true});

userSchema.pre('save' , function(next){
const user = this;

if(!user.isModified('password')) return ;

const salt = randomBytes(16).toString('hex'); 
const hashedPassword = createHmac('sha256' , salt).update(user.password).digest('hex');

this.salt = salt;
this.password = hashedPassword ;
next();
})

userSchema.static('matchPassword' , async function(email , password){
const user = await this.findOne({email});
if(!user) throw new Error("Invalid Credentials");

const salt = user.salt ;
const hashedPassword = user.password ;

const inputHashedPassword = createHmac('sha256' , salt).update(password).digest('hex');

if(hashedPassword !== inputHashedPassword) throw new Error("Incorrect Password");
return user
})
const User = model('user' , userSchema);

module.exports = User ;