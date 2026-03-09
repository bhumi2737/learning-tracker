
const { readData, writeData } = require("../utils/file.util");
const crypto = require("crypto");

exports.createTask = (req, res) => {
  const tasks = readData();
  const { userId, ...taskData } = req.body;

  const newTask = {
    id: crypto.randomUUID(),
    userId, // Associate task with user
    ...taskData
  };

  tasks.push(newTask);
  writeData(tasks);

  res.status(201).json(newTask);
};

exports.getTasks = (req, res) => {
  const tasks = readData();
  const { userId } = req.query;

  let userTasks = tasks;
  if (userId) {
    userTasks = tasks.filter(t => t.userId === userId);
  }

  res.json(userTasks);
};

exports.updateTask = (req, res) => {
  const tasks = readData();
  const index = tasks.findIndex(t => t.id === req.params.id);

  if(index === -1){
    return res.status(404).json({message:"Task not found"});
  }

  tasks[index] = {...tasks[index], ...req.body};

  writeData(tasks);

  res.json(tasks[index]);
};

exports.deleteTask = (req, res) => {
  const tasks = readData();

  const filtered = tasks.filter(t => t.id !== req.params.id);

  writeData(filtered);

  res.json({message:"Task deleted"});
};
