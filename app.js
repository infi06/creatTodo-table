const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// declare
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//API 1 Get

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//get state API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getStateQuery = `
    SELECT *
    FROM todo
     WHERE id=${todoId};`;
  const todoList = await db.get(getStateQuery);
  response.send({
    id: todoList.id,
    todo: todoList.todo,
    priority: todoList.priority,
    status: todoList.status,
  });
});

//post

app.post("/todos/", async (request, response) => {
  const districtDetails = request.body;
  const { id, todo, priority, status } = districtDetails;
  const addDistrictQuery = `INSERT INTO 
     todo(id, todo, priority, status)
  VALUES (
      ${id}, '${todo}', '${priority}', '${status}'
    );`;
  const dbResponse = await db.run(addDistrictQuery);
  console.log(dbResponse);
  response.send("Todo Successfully Added");
});

//delete player API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteDistrictQuery = `
    DELETE FROM todo
    WHERE 
      id = ${todoId};`;
  const districtDEl = await db.run(deleteDistrictQuery);
  response.send("Todo Deleted");
});

//put

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateDistrictQuery = `
    UPDATE todo
    SET 
     
     todo='${todo}',
     priority='${priority}',
     status='${status}'
     
     
    WHERE 
      id = ${todoId};`;
  const districtInform = await db.run(updateDistrictQuery);
  response.send(`${updateColumn} Updated`);
});

module.exports = app;
