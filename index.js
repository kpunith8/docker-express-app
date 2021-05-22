const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const redis = require("redis");

const cors = require("cors");
const {
  MONGO_IP,
  MONGO_PASSWORD,
  MONGO_PORT,
  MONGO_USER,
  EXPRESS_PORT,
  REDIS_URL,
  REDIS_PORT,
  SESSION_SECRET,
} = require("./config/config");
const userRouter = require("./routes/user-routes");

const RedisStore = require("connect-redis")(session);
const redisClient = redis.createClient({
  host: REDIS_URL,
  port: REDIS_PORT,
});

const app = express();

const connectWithRetry = () =>
  mongoose
    // Grab the IP address by ispecting running mongo container
    // .connect("mongodb://root:root@mongo:27017/?authSource=admin")
    // Instead of using the random IP, use the service name assigned in docker-compose.yml
    // file to connect to the db, whenever new image created and started a new container
    .connect(
      `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )
    .then(() => console.log("DB connection successful!"))
    .catch((err) => {
      console.log("Error connecting to the DB", err);
      // Retry after 3 seconds
      setTimeout(connectWithRetry, 3000);
    });

// Retry connecting to the DB if in case mongo container is not up and running
connectWithRetry();

// To allow ngnix proxy to make requests on prod environment
app.enable("trust proxy")

app.use(cors());
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 30 * 1000 * 1000,
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/v1", (req, res) => res.send("<h2>Docker express app!!</h2>"));
app.use("/api/v1/users", userRouter);

app.listen(EXPRESS_PORT, () => console.log(`Listening on ${EXPRESS_PORT}`));
