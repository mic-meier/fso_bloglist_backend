const mongoose = require("mongoose");
const supertest = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../app");
const api = supertest(app);
const helper = require("./test_helper");

const Blog = require("../models/blog");
const User = require("../models/user");
let token;

describe("Making a GET request to the /api/blogs endpoint", () => {
  beforeEach(async () => {
    await Blog.deleteMany({});

    const blogObjects = helper.initialBlogs.map((blog) => new Blog(blog));
    const promiseArray = blogObjects.map((blog) => blog.save());
    await Promise.all(promiseArray);
  });

  test("returns blogs as JSON", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("returns six blogs", async () => {
    const res = await api.get("/api/blogs");

    expect(res.body.length).toBe(helper.initialBlogs.length);
  });

  test("returns unique identifier of blog posts as id and not _id", async () => {
    const res = await api.get("/api/blogs");

    res.body.forEach((blog) => {
      expect(blog.id).toBeDefined();
    });
  });
});

describe("Making a POST request to the /api/blogs endpoint", () => {
  beforeEach(async () => {
    await Blog.deleteMany({});

    const blogObjects = helper.initialBlogs.map((blog) => new Blog(blog));
    const promiseArray = blogObjects.map((blog) => blog.save());
    await Promise.all(promiseArray);

    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("Selina", 10);

    const user = new User({
      username: "Batman",
      name: "Bruce Wayne",
      passwordHash: passwordHash,
    });

    await user.save();

    const res = await api
      .post("/api/login")
      .send({ username: "Batman", password: "Selina" });

    token = "bearer ".concat(res.body.token);
  });

  test("with logged in user and valid blog successfully creates a new blog", async () => {
    const newBlog = {
      title: "What Are the React Team Principles?",
      author: "Dan Abramov",
      url: "https://overreacted.io/what-are-the-react-team-principles/",
      likes: 42,
    };

    await api
      .post("/api/blogs")
      .set("Authorization", token)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();

    const titles = blogsAtEnd.map((blog) => blog.title);

    expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1);
    expect(titles).toContain("What Are the React Team Principles?");
  });

  test("with logged in user creates a blog with 0 likes, if likes is omitted in request", async () => {
    const newBlog = {
      title: "What Are the React Team Principles?",
      author: "Dan Abramov",
      url: "https://overreacted.io/what-are-the-react-team-principles/",
    };

    await api
      .post("/api/blogs")
      .set("Authorization", token)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/)
      .expect((res) => {
        expect(res.body.likes).toBe(0);
      });
  });

  test("with logged in user returns status code 400 if blog title is missing from POST request", async () => {
    const newBlog = {
      author: "Dan Abramov",
      url: "https://overreacted.io/what-are-the-react-team-principles/",
    };

    await api
      .post("/api/blogs")
      .set("Authorization", token)
      .send(newBlog)
      .expect(400);
  });

  test("with logged in user returns status code 400 if blog url is missing from POST request", async () => {
    const newBlog = {
      title: "What Are the React Team Principles?",
      author: "Dan Abramov",
    };

    await api
      .post("/api/blogs")
      .set("Authorization", token)
      .send(newBlog)
      .expect(400);
  });

  test("with valid blog post but not logged in user  does not create a new blog and responds with status 401", async () => {
    const newBlog = {
      title: "What Are the React Team Principles?",
      author: "Dan Abramov",
      url: "https://overreacted.io/what-are-the-react-team-principles/",
      likes: 42,
    };

    await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(401)
      .expect("Content-Type", /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd.length).toBe(helper.initialBlogs.length);
  });
});

describe("DELETE request to /api/blogs/id endpoint", () => {
  beforeEach(async () => {
    await Blog.deleteMany({});

    const blogObjects = helper.initialBlogs.map((blog) => new Blog(blog));
    const promiseArray = blogObjects.map((blog) => blog.save());
    await Promise.all(promiseArray);

    // Set up logged in user
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("Selina", 10);

    const user = new User({
      username: "Batman",
      name: "Bruce Wayne",
      passwordHash: passwordHash,
    });

    await user.save();

    const res = await api
      .post("/api/login")
      .send({ username: "Batman", password: "Selina" });

    token = "bearer ".concat(res.body.token);

    // Set up blog created by logged in user
    const newBlog = {
      title: "What Are the React Team Principles?",
      author: "Dan Abramov",
      url: "https://overreacted.io/what-are-the-react-team-principles/",
      likes: 42,
    };

    await api.post("/api/blogs").set("Authorization", token).send(newBlog);
  });

  test("fails with status code 401 if id is valid and user is not logged in", async () => {
    const blogsAtStart = await helper.blogsInDb();

    const blogToDelete = blogsAtStart[blogsAtStart.length - 1];

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(401);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd.length).toBe(blogsAtStart.length);
  });

  test("succeeds with statuscode 204 if id is valid and user is logged in", async () => {
    const blogsAtStart = await helper.blogsInDb();

    const blogToDelete = blogsAtStart[blogsAtStart.length - 1];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set("Authorization", token)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd.length).toBe(blogsAtStart.length - 1);
  });
});

test("can update number of likes on an existing blog post", async () => {
  const blogsAtStart = await helper.blogsInDb();
  const blogToUpdate = blogsAtStart[0];

  blogToUpdate.likes = 777;

  await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(blogToUpdate)
    .expect(200)
    .expect((res) => {
      expect(res.body.likes).toBe(777);
    });
});

afterAll(() => {
  mongoose.connection.close();
});
