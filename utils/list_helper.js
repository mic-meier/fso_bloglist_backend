const dummy = blogs => {
  return 1;
};

const totalLikes = blogs =>
  blogs
    .map(blog => blog.likes)
    .reduce((accumulator, blog) => accumulator + blog, 0);

const favoriteBlog = blogs => {
  if (blogs.length === 1) {
    return {
      title: blogs[0].title,
      author: blogs[0].author,
      likes: blogs[0].likes
    };
  } else if (blogs.length > 1) {
    return blogs.reduce((acc, blog) =>
      blog.likes > acc.likes
        ? { title: blog.title, author: blog.author, likes: blog.likes }
        : acc
    );
  }
  return undefined;
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
};
