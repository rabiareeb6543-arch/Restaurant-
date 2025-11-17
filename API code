// Program.cs

// --- 1. Data Model ---
// Defining the record globally.
global record Todo(int Id, string Title, bool IsComplete);
global record TodoCreateRequest(string Title); // For input validation
global record TodoUpdateRequest(string Title, bool IsComplete); // For input validation

// --- 2. In-Memory Data Store and Initial Setup ---
var todos = new List<Todo>
{
    new Todo(1, "Create ASP.NET API", true),
    new Todo(2, "Debug and test endpoints", false),
    new Todo(3, "Submit assignment", false)
};

// Create the web application builder
var builder = WebApplication.CreateBuilder(args);

// --- 3. Service Configuration (Adding Middleware/Swagger) ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    // Adding security definition for potential future authentication middleware
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Please insert JWT with Bearer into field",
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey
    });
});

var app = builder.Build();

// --- 4. Custom Middleware Implementation (Requirement #5: Logging/Authentication) ---
// Custom Logging Middleware to log every request path and method.
app.Use(async (context, next) =>
{
    Console.WriteLine($"[LOGGING MIDDLEWARE] Request started: {context.Request.Method} {context.Request.Path}");
    // Simulate Authentication Check for POST/PUT/DELETE
    if (context.Request.Path.StartsWithSegments("/todos") && 
        (context.Request.Method == "POST" || context.Request.Method == "PUT" || context.Request.Method == "DELETE"))
    {
        // Simple token check: in a real app, this would be a JWT validation
        var authHeader = context.Request.Headers["X-Auth-Token"].FirstOrDefault();
        if (authHeader != "valid-api-key")
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsync("Unauthorized. A valid 'X-Auth-Token' is required for modification operations.");
            return;
        }
    }
    await next(); // Proceed to the next middleware or endpoint
    Console.WriteLine($"[LOGGING MIDDLEWARE] Request finished: {context.Response.StatusCode}");
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// --- 5. API Endpoints (CRUD Operations with Validation) ---

// GET /todos: Retrieve all To-Do items
app.MapGet("/todos", () => Results.Ok(todos))
.WithName("GetAllTodos");

// GET /todos/{id}: Retrieve a specific To-Do item
app.MapGet("/todos/{id:int}", (int id) =>
{
    var todo = todos.FirstOrDefault(t => t.Id == id);
    return todo is null ? Results.NotFound() : Results.Ok(todo);
})
.WithName("GetTodoById");

// POST /todos: Create a new To-Do item (Requirement #4: Validation)
app.MapPost("/todos", (TodoCreateRequest newTodoRequest) =>
{
    // VALIDATION: Check for a required Title (Requirement #4)
    if (string.IsNullOrWhiteSpace(newTodoRequest.Title))
    {
        return Results.BadRequest("Title is required and cannot be empty.");
    }

    // Use a title length limit as an additional validation check
    if (newTodoRequest.Title.Length > 100)
    {
        return Results.BadRequest("Title length cannot exceed 100 characters.");
    }

    int newId = todos.Any() ? todos.Max(t => t.Id) + 1 : 1;
    var todoToAdd = new Todo(newId, newTodoRequest.Title, false);

    todos.Add(todoToAdd);

    return Results.Created($"/todos/{todoToAdd.Id}", todoToAdd);
})
.WithName("CreateTodo");

// PUT /todos/{id}: Update an existing To-Do item (Requirement #4: Validation)
app.MapPut("/todos/{id:int}", (int id, TodoUpdateRequest updatedTodoRequest) =>
{
    var existingTodo = todos.FirstOrDefault(t => t.Id == id);
    if (existingTodo is null)
    {
        return Results.NotFound();
    }

    // VALIDATION: Check for a required Title (Requirement #4)
    if (string.IsNullOrWhiteSpace(updatedTodoRequest.Title))
    {
        return Results.BadRequest("Title is required for update.");
    }

    // Use a title length limit as an additional validation check
    if (updatedTodoRequest.Title.Length > 100)
    {
        return Results.BadRequest("Title length cannot exceed 100 characters.");
    }

    // Create the fully updated Todo record
    var updatedTodo = new Todo(id, updatedTodoRequest.Title, updatedTodoRequest.IsComplete);
    
    todos.Remove(existingTodo);
    todos.Add(updatedTodo); 

    return Results.NoContent();
})
.WithName("UpdateTodo");

// DELETE /todos/{id}: Delete a To-Do item
app.MapDelete("/todos/{id:int}", (int id) =>
{
    int removedCount = todos.RemoveAll(t => t.Id == id);
    return removedCount == 0 ? Results.NotFound() : Results.NoContent();
})
.WithName("DeleteTodo");

// --- 6. Run the Application ---
app.Run();
