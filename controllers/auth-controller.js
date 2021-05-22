const bcrypt = require("bcryptjs");
const User = require("../models/user-model");

exports.user = async (req, res) => {
  res.status(200).json({ status: "Success", data: { userName: req.username } });
};

exports.signup = async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({ username, password: hashedPassword });
    res.status(201).json({
      status: "Success",
      data: { user: newUser.username },
    });
  } catch (e) {
    res.status(400).json({
      status: "Failed to create an user",
      error: e.message,
    });
  }
};

exports.signin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        status: "Fail",
        message: "User not found!",
      });
    } else {
      const isCorrectPassword = await bcrypt.compare(password, user.password);

      if (isCorrectPassword) {
        // Update the session with username
        req.session.username = user.username;
        return res.status(200).json({
          status: "Success",
          message: "Login successful!",
        });
      } else {
        return res.status(400).json({
          status: "Fail",
          message: "Invalid username or password",
        });
      }
    }
  } catch (e) {
    console.log(e.message);
  }
};
