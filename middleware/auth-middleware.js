const protect = (req, res, next) => {
  const { username } = req.session;

  if (!username) {
    return res.status(401).json({ status: "Fail", message: "unauthorized" });
  }
  // Assign the username from session to user object on req,
  // so that we can access the user in other protected routes
  req.username = username;
  next();
};

module.exports = protect;
