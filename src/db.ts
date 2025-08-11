import mongoose, { model,Schema } from "mongoose";


mongoose.connect("mongodb+srv://atharvamagre13:Itachi%4002@cluster0.fentksr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0").then(()=>{
    console.log("Connected to MongoDB successfully");
}).catch((error)=>{
    console.error("MongoDB connection error:", error);
});


const UserSchema = new Schema({
username: {type: String,unique: true},
  password: String,
})

export const UserModel = model("User",UserSchema);


const ContentSchema = new Schema({
  title: String,
  link: String,
  tags: [{type: mongoose.Types.ObjectId, ref: 'Tag'}],
  type: String,
  userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true },
})

const LinkSchema = new Schema({
  hash: String,
  userId: {type: mongoose.Types.ObjectId , ref: "User",required: true,unique: true },
})

export const LinkModel = model("Link",LinkSchema);
export const ContentModel = model("Content",ContentSchema);