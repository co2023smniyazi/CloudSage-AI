/**
 * Cloudflare Worker: Student Task Management System
 * Provides RESTful API endpoints backed by Cloudflare Workers KV (TASKS_KV)
 * and serves the bundled single-page application frontend.
 */

// Placeholder replaced during build step by scripts/build.js
const BUNDLED_HTML = `__BUNDLED_HTML_CONTENT__`;

// Standard CORS and Security Headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

// JSON Response helper
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
    },
  });
}

// Error Response helper
function errorResponse(message, status = 400) {
  return jsonResponse(
    {
      success: false,
      error: message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    },
    status
  );
}

// Generate Next Sequential Task ID (e.g. T101, T102...)
async function getNextTaskId(kv) {
  const counterKey = "_meta:task_counter";
  const rawCounter = await kv.get(counterKey);
  let counter = 100;

  if (rawCounter !== null) {
    const parsed = parseInt(rawCounter, 10);
    if (!isNaN(parsed) && parsed >= 100) {
      counter = parsed;
    }
  } else {
    // Check if any existing keys exist to prevent collisions
    const existing = await kv.list({ prefix: "task:T" });
    let maxId = 100;
    for (const key of existing.keys) {
      const match = key.name.match(/^task:T(\d+)$/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxId) maxId = val;
      }
    }
    counter = maxId;
  }

  const nextNumber = counter + 1;
  await kv.put(counterKey, String(nextNumber));
  return `T${nextNumber}`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    // 1. Handle CORS Preflight OPTIONS requests
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // 2. Health & System Info endpoint
    if (pathname === "/api/health" && method === "GET") {
      const kvReady = !!env.TASKS_KV;
      return jsonResponse({
        status: "healthy",
        app: "student-task-manager",
        environment: env.ENVIRONMENT || "production",
        kvBindingReady: kvReady,
        timestamp: new Date().toISOString(),
      });
    }

    // 3. API Router: /api/tasks and /api/tasks/:id
    if (pathname.startsWith("/api/tasks")) {
      if (!env.TASKS_KV) {
        return errorResponse("TASKS_KV binding not configured on Worker", 500);
      }

      const pathParts = pathname.split("/").filter(Boolean); // ['api', 'tasks', optional ':id']
      const taskId = pathParts.length >= 3 ? pathParts[2] : null;

      try {
        // --- GET /api/tasks: List all tasks ---
        if (method === "GET" && !taskId) {
          const listResult = await env.TASKS_KV.list({ prefix: "task:" });
          const tasks = [];

          // Fetch all tasks in parallel
          const fetchPromises = listResult.keys.map(async (keyItem) => {
            const data = await env.TASKS_KV.get(keyItem.name, { type: "json" });
            return data;
          });

          const resolved = await Promise.all(fetchPromises);
          for (const item of resolved) {
            if (item && item.id) {
              tasks.push(item);
            }
          }

          // Sort by creation date descending by default
          tasks.sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0));

          return jsonResponse({
            success: true,
            count: tasks.length,
            data: tasks,
          });
        }

        // --- POST /api/tasks: Create new task ---
        if (method === "POST" && !taskId) {
          let body;
          try {
            body = await request.json();
          } catch {
            return errorResponse("Invalid JSON payload in request body", 400);
          }

          const { title, priority, status } = body || {};

          // Input validation
          if (!title || typeof title !== "string" || title.trim().length === 0) {
            return errorResponse("Task 'title' is required and must be a non-empty string", 400);
          }
          if (title.trim().length > 200) {
            return errorResponse("Task 'title' cannot exceed 200 characters", 400);
          }

          const validPriorities = ["High", "Medium", "Low"];
          const cleanPriority = validPriorities.includes(priority) ? priority : "Medium";

          const validStatuses = ["Pending", "Completed"];
          const cleanStatus = validStatuses.includes(status) ? status : "Pending";

          const newId = await getNextTaskId(env.TASKS_KV);
          const taskObj = {
            id: newId,
            title: title.trim(),
            priority: cleanPriority,
            status: cleanStatus,
            createdDate: new Date().toISOString(),
          };

          await env.TASKS_KV.put(`task:${newId}`, JSON.stringify(taskObj));

          return jsonResponse(
            {
              success: true,
              message: "Task created successfully",
              data: taskObj,
            },
            201
          );
        }

        // --- GET /api/tasks/:id: Get single task ---
        if (method === "GET" && taskId) {
          const task = await env.TASKS_KV.get(`task:${taskId}`, { type: "json" });
          if (!task) {
            return errorResponse(`Task with ID '${taskId}' not found`, 404);
          }
          return jsonResponse({
            success: true,
            data: task,
          });
        }

        // --- PUT /api/tasks/:id: Update task ---
        if (method === "PUT" && taskId) {
          const existing = await env.TASKS_KV.get(`task:${taskId}`, { type: "json" });
          if (!existing) {
            return errorResponse(`Task with ID '${taskId}' not found`, 404);
          }

          let body;
          try {
            body = await request.json();
          } catch {
            return errorResponse("Invalid JSON payload in request body", 400);
          }

          const { title, priority, status } = body || {};

          if (title !== undefined) {
            if (typeof title !== "string" || title.trim().length === 0) {
              return errorResponse("Updated 'title' must be a non-empty string", 400);
            }
            if (title.trim().length > 200) {
              return errorResponse("Updated 'title' cannot exceed 200 characters", 400);
            }
            existing.title = title.trim();
          }

          if (priority !== undefined) {
            if (!["High", "Medium", "Low"].includes(priority)) {
              return errorResponse("Priority must be one of: High, Medium, Low", 400);
            }
            existing.priority = priority;
          }

          if (status !== undefined) {
            if (!["Pending", "Completed"].includes(status)) {
              return errorResponse("Status must be one of: Pending, Completed", 400);
            }
            existing.status = status;
          }

          existing.updatedDate = new Date().toISOString();
          await env.TASKS_KV.put(`task:${taskId}`, JSON.stringify(existing));

          return jsonResponse({
            success: true,
            message: `Task '${taskId}' updated successfully`,
            data: existing,
          });
        }

        // --- DELETE /api/tasks/:id: Delete task ---
        if (method === "DELETE" && taskId) {
          const existing = await env.TASKS_KV.get(`task:${taskId}`);
          if (!existing) {
            return errorResponse(`Task with ID '${taskId}' not found`, 404);
          }

          await env.TASKS_KV.delete(`task:${taskId}`);
          return jsonResponse({
            success: true,
            message: `Task '${taskId}' deleted successfully`,
          });
        }

        return errorResponse(`Method ${method} not allowed for /api/tasks`, 405);
      } catch (err) {
        return errorResponse(`Internal Server Error: ${err.message}`, 500);
      }
    }

    // 4. Serve Single-Page Application (Frontend)
    if (pathname === "/" || pathname === "/index.html") {
      return new Response(BUNDLED_HTML, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // 404 Catch-All
    return new Response("404 Not Found - The requested resource does not exist on this Worker.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};

