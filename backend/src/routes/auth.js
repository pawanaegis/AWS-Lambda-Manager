import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import winston from "winston";

const router = express.Router();

// Register route
// router.post("/register", async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     winston.info(`Register attempt for username: ${username}`);
//     if (!username || !password) {
//       winston.warn("Register failed: Username and password are required.");
//       return res.status(400).json({ message: "Username and password are required." });
//     }
//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//       winston.warn(`Register failed: User already exists (${username})`);
//       return res.status(409).json({ message: "User already exists." });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ username, password: hashedPassword });
//     await user.save();
//     winston.info(`User registered successfully: ${username}`);
//     res.status(201).json({ message: "User registered successfully." });
//   } catch (err) {
//     winston.error(`Register error: ${err}`);
//     res.status(500).json({ message: "Server error." });
//   }
// });

// Login route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    winston.info(`Login attempt for username: ${username}`);
    if (!username || !password) {
      winston.warn("Login failed: Username and password are required.");
      return res.status(400).json({ message: "Username and password are required." });
    }
    const user = await User.findOne({ username });
    if (!user) {
      winston.warn(`Login failed: Invalid credentials for username: ${username}`);
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      winston.warn(`Login failed: Invalid credentials for username: ${username}`);
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "30m" });
    winston.info(`Login successful for username: ${username}`);
    res.json({ token });
  } catch (err) {
    winston.error(`Login error: ${err}`);
    res.status(500).json({ message: "Server error." });
  }
});

export default router;