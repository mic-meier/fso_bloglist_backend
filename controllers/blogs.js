const blogsRouter = require("express").Router();
const Blog = require("../models/blog");

blogsRouter.get("/", async (req, res) => {
  const blogs = await Blog.find({});
  res.json(blogs.map(blog => blog.toJSON()));
});

blogsRouter.post("/", async (req, res) => {
  const body = req.body;

  if (!body.title || !body.url) {
    res.status(400).end();
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0
  });

  const savedBlog = await blog.save();
  res.status(201).json(savedBlog.toJSON());
});

blogsRouter.delete("/:id", async (req, res) => {
  await Blog.findByIdAndRemove(req.params.id);

  res.status(204).end();
});

module.exports = blogsRouter;
