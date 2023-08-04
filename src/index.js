const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const userAlreadyExists = users.find((user) => user.username === username);

  if (userAlreadyExists) {
    request.user = userAlreadyExists;
    return next();
  }

  return response.status(404).json({ error: "User does not exist." });
}

function usersMiddleware(request, response, next) {
  const { name, username } = request.body;

  if (name && username) return next();

  return response
    .status(400)
    .json({ error: "Parameters name and username is required!" });
}

function checksExistsTodo(request, response, next) {
  const { user } = request;
  const { id } = request.params;

  const todoExists = user.todos.find((todo) => todo.id === id);

  if (todoExists) {
    return next();
  }

  return response.status(404).json({ error: "Todo does not exist." });
}

app.post("/users", usersMiddleware, (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.find((user) => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({ error: "User already exists." });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.status(200).json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  const newTask = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  const index = users.findIndex((item) => item.username === user.username);

  users[index].todos.push(newTask);

  return response.status(201).json(newTask);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const { title, deadline } = request.body;
    const { id } = request.params;
    const { user } = request;

    const userIndex = users.findIndex(
      (item) => item.username === user.username
    );
    const taskIndex = users[userIndex].todos.findIndex(
      (item) => item.id === id
    );

    users[userIndex].todos[taskIndex].title = title;
    users[userIndex].todos[taskIndex].deadline = new Date(deadline);
    users[userIndex].todos[taskIndex].done

    const editedTodo = {
      title,
      deadline: new Date(deadline).toISOString(),
      done: users[userIndex].todos[taskIndex].done,
    };

    return response.json(editedTodo);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const { id } = request.params;
    const { user } = request;

    const userIndex = users.findIndex(
      (item) => item.username === user.username
    );
    const taskIndex = users[userIndex].todos.findIndex(
      (item) => item.id === id
    );

    users[userIndex].todos[taskIndex].done = true;

    return response.json(users[userIndex].todos[taskIndex]);
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const { id } = request.params;
    const { user } = request;

    const userIndex = users.findIndex(
      (item) => item.username === user.username
    );

    users[userIndex].todos = users[userIndex].todos.filter(
      (todo) => todo.id !== id
    );

    return response.status(204).end();
  }
);

module.exports = app;
