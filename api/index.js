const express = require('express');
const mongoose = require('mongoose');
const bcrypt=require('bcrypt');
const cors=require('cors');
const app = express();

app.use(cors({
    origin:'http://localhost:3000',
    credentials:true
}));

app.use(express.json());

  
mongoose.connect('mongodb://127.0.0.1:27017/Main_Blog', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));
    const UserSchema = new mongoose.Schema({
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
      });
      
      const User = mongoose.model('User', UserSchema);
      const PostSchema = new mongoose.Schema({
        username: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
        title: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      });
      
      const Post = mongoose.model("Post", PostSchema);

app.post('/register', async(req,res)=>{
    const {username,password}=req.body;

    try{
        const existingUser= await User.findOne({username});
        if(existingUser){
            return res.status(400).json({ message: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(200).json({ message: 'Registration successful' });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ message: 'Registration failed' });
    }
})

app.post('/login',async(req,res)=>{
    const {username,password}=req.body;
    const user=await User.findOne({username});
   try{
    if(!user){
        res.status(400).json({message:'user not found'});
    }
    const isPasswordValid=await bcrypt.compare(password,user.password);
    if(!isPasswordValid){
        return res.status(401).json({message:'Invalid password'});
    }
    const userInfo={
      id:user._id,
      username:user.username,
    };
    res.status(200).json({message:'Login successfull',user:userInfo });
   }
   catch(err){
    console.log(err);
    res.status(500).json({message:'Login failed'})
   }
})
app.post('/post', async (req, res) => {
  console.log("Received POST request with:", req.body);
  const { username, userId, title, content } = req.body;
  try {
    console.log("Checking if user exists...");
    const user = await User.findOne({ _id: new mongoose.Types.ObjectId(userId), username });

    if (!user) {
      console.log("User not found in DB");
      return res.status(404).json({ message: 'User not found' });
    }
    console.log("User found! Creating a new post...");
    const newPost = new Post({ username, userId, title, content });

    await newPost.save();
    console.log("Post created successfully:", newPost);

    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ message: 'Failed to create the post', error: err.message });
  }
});

app.get('/myposts/:username', async (req, res) => {
  try {
    const username = req.params.username; // Extract username from URL
    console.log(`Fetching posts for user: ${username}`);

    const posts = await Post.find({ username }); // Fetch all posts for the user

    if (posts.length > 0) {
      console.log("Posts found:", posts); // Log entire collection
      return res.json(posts);
    } else {
      console.log("No posts found for:", username);
      return res.status(404).json({ message: "No posts found" });
    }
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/allposts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }); // Fetch all posts sorted by latest
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});


app.listen(4000,()=>{
    console.log('Server is running on port http://localhost:4000');
});

