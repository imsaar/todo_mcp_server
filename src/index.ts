#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple todos system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing todos as resources
 * - Reading individual todos
 * - Creating new todos via a tool
 * - Summarizing all todos via a prompt
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * Type alias for a todo object.
 */
type Todo = { title: string, content: string, done: boolean };

/**
 * Simple in-memory storage for todos.
 * In a real implementation, this would likely be backed by a database.
 */
const todos: { [id: string]: Todo } = {
  "1": { title: "First Note", content: "This is todo 1", done: false },
  "2": { title: "Second Note", content: "This is todo 2", done: false }
};

/**
 * Create an MCP server with capabilities for resources (to list/read todos),
 * tools (to create new todos), and prompts (to summarize todos).
 */
const server = new Server(
  {
    name: "saar-todo",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

/**
 * Handler for listing available todos as resources.
 * Each todo is exposed as a resource with:
 * - A todo:// URI scheme
 * - Plain text MIME type
 * - Human readable name and description (now including the todo title)
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: Object.entries(todos).map(([id, todo]) => ({
      uri: `todo:///${id}`,
      mimeType: "text/plain",
      name: todo.title,
      description: `A text todo: ${todo.title}`
    }))
  };
});

/**
 * Handler for reading the contents of a specific todo.
 * Takes a todo:// URI and returns the todo content as plain text.
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = new URL(request.params.uri);
  const id = url.pathname.replace(/^\//, '');
  const todo = todos[id];

  if (!todo) {
    throw new Error(`Note ${id} not found`);
  }

  return {
    contents: [{
      uri: request.params.uri,
      mimeType: "text/plain",
      text: todo.content
    }]
  };
});

/**
 * Handler that lists available tools.
 * Exposes a single "create_todo" tool that lets clients create new todos.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_todo",
        description: "Create a new todo",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title of the todo"
            },
            content: {
              type: "string",
              description: "Text content of the todo"
            }
          },
          required: ["title", "content"]
        }
      }
    ]
  };
});

/**
 * Handler for the create_todo tool.
 * Creates a new todo with the provided title and content, and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "create_todo": {
      const title = String(request.params.arguments?.title);
      const content = String(request.params.arguments?.content);
      if (!title || !content) {
        throw new Error("Title and content are required");
      }

      const id = String(Object.keys(todos).length + 1);
      todos[id] = { title, content, done: false };

      return {
        content: [{
          type: "text",
          text: `Created todo ${id}: ${title}`
        }]
      };
    }

    default:
      throw new Error("Unknown tool");
  }
});

/**
 * Handler that lists available prompts.
 * Exposes a single "summarize_todos" prompt that summarizes all todos.
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "summarize_todos",
        description: "Summarize all todos",
      }
    ]
  };
});

/**
 * Handler for the summarize_todos prompt.
 * Returns a prompt that requests summarization of all todos, with the todos' contents embedded as resources.
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name !== "summarize_todos") {
    throw new Error("Unknown prompt");
  }

  const embeddedNotes = Object.entries(todos).map(([id, todo]) => ({
    type: "resource" as const,
    resource: {
      uri: `todo:///${id}`,
      mimeType: "text/plain",
      text: todo.content
    }
  }));

  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Please summarize the following todos:"
        }
      },
      ...embeddedNotes.map(todo => ({
        role: "user" as const,
        content: todo
      })),
      {
        role: "user",
        content: {
          type: "text",
          text: "Provide a concise summary of all the todos above."
        }
      }
    ]
  };
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
