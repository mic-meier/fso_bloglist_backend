const dummy = blogs => {
  return 1;
};

const totalLikes = blogs =>
  blogs
    .map(blog => blog.likes)
    .reduce((accumulator, blog) => accumulator + blog, 0);

module.exports = {
  dummy,
  totalLikes
};
