const jwt = require("jsonwebtoken");
const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const User = require("../models/user");

blogsRouter.get("/", async (req, res) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, name: 1 });
  res.json(blogs.map((blog) => blog.toJSON()));
});

blogsRouter.post("/", async (req, res) => {
  const body = req.body;

  const decodedToken = jwt.verify(req.token, process.env.SECRET);

  if (!decodedToken) {
    return res.status(401).json({ error: "token missing or invalid" });
  }

  const user = await User.findById(decodedToken.id);

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id,
  });

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();

  const blogToReturn = await Blog.findById(savedBlog.id).populate("user", {
    username: 1,
    name: 1,
  });

  res.status(201).json(blogToReturn.toJSON());
});

blogsRouter.post("/:id/comments", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  console.log("blogToCommentOn", blog);

  const body = req.body;
  console.log("body", body);

  const newBlog = {
    title: blog.title,
    author: blog.author,
    url: blog.url,
    likes: blog.likes,
    user: blog.user,
    comments: blog.comments.concat(body.comment),
  };
  console.log("blog", blog);

  const updatedBlog = await (
    await Blog.findByIdAndUpdate(req.params.id, newBlog, { new: true })
  ).populate("user", { username: 1, name: 1 });

  console.log("updatedBlog", updatedBlog);

  res.status(200).json(updatedBlog.toJSON());
});

blogsRouter.delete("/:id", async (req, res) => {
  const decodedToken = jwt.verify(req.token, process.env.SECRET);

  const user = await User.findById(decodedToken.id);
  const blogToDelete = await Blog.findById(req.params.id);

  if (blogToDelete.user.toString() === user.id.toString()) {
    await Blog.findByIdAndRemove(req.params.id);
  } else {
    return res.status(401).json({ error: "user is not owner of blog entry" });
  }

  res.status(204).end();
});

blogsRouter.put("/:id", async (req, res) => {
  const body = req.body;

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: body.user,
  };

  const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, blog, {
    new: true,
  }).populate("user", { username: 1, name: 1 });

  res.status(200).json(updatedBlog.toJSON());
});

module.exports = blogsRouter;
