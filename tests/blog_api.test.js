const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const helper = require("./test_helper");

const Blog = require("../models/blog");

beforeEach(async () => {
  await Blog.deleteMany({});

  const blogObjects = helper.initialBlogs.map(blog => new Blog(blog));
  const promiseArray = blogObjects.map(blog => blog.save());
  await Promise.all(promiseArray);
});

test("blogs are returned as json", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("there are six blogs", async () => {
  const res = await api.get("/api/blogs");

  expect(res.body.length).toBe(helper.initialBlogs.length);
});

test("unique identifier of blog posts is named id and not _id", async () => {
  const res = await api.get("/api/blogs");

  res.body.forEach(blog => {
    expect(blog.id).toBeDefined();
  });
});

test("POST request to endpoint /api/blogs with valid blog post successfully creates a new blog", async () => {
  const newBlog = {
    title: "What Are the React Team Principles?",
    author: "Dan Abramov",
    url: "https://overreacted.io/what-are-the-react-team-principles/",
    likes: 42
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const blogsAtEnd = await helper.blogsInDb();

  const titles = blogsAtEnd.map(blog => blog.title);

  expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1);
  expect(titles).toContain("What Are the React Team Principles?");
});

test("value of likes defaults to 0 if omitted in the POST request", async () => {
  const newBlog = {
    title: "What Are the React Team Principles?",
    author: "Dan Abramov",
    url: "https://overreacted.io/what-are-the-react-team-principles/"
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/)
    .expect(res => {
      expect(res.body.likes).toBe(0);
    });
});

test("returns status code 400 if blog title is missing from POST request", async () => {
  const newBlog = {
    author: "Dan Abramov",
    url: "https://overreacted.io/what-are-the-react-team-principles/"
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(400);
});

test("returns status code 400 if blog url is missing from POST request", async () => {
  const newBlog = {
    title: "What Are the React Team Principles?",
    author: "Dan Abramov"
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(400);
});

afterAll(() => {
  mongoose.connection.close();
});
