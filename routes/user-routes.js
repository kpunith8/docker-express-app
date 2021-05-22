const express = require("express");
const { signin, signup, user } = require("../controllers/auth-controller");
const protect = require("../middleware/auth-middleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.route("/:username").get(protect, user);

// Similar routes can be chained under a single route name
// both post and get request on /:username can be written as follows,
// router.route("/:username").get(protect, user).post(protect, product);

module.exports = router;
