const { readData: readUsers, writeData: writeUsers } = require("../utils/user.util");
const { readData: readTasks, writeData: writeTasks } = require("../utils/file.util");
const crypto = require("crypto");

exports.registerUser = (req, res) => {
  const users = readUsers();
  const { email, password, name } = req.body;

  // Check if user already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const newUser = {
    id: crypto.randomUUID(),
    email,
    password, // Plain text for demo only!
    name,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsers(users);

  res.status(201).json({ message: "User registered successfully", userId: newUser.id });
};

exports.loginUser = (req, res) => {
  const users = readUsers();
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({ message: "Login successful", userId: user.id, name: user.name });
};