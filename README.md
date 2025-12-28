# Visualping Client (TypeScript)

A lightweight, typed Node.js + TypeScript wrapper for the Visualping v2 API. No extra dependencies required.

This package provides a TypeScript-first SDK for interacting with Visualping jobs, users, and monitoring configuration.

API Reference:
https://api.visualping.io/doc.html

---

## Installation

```bash
npm i visualping-client
```

### Requirements

Node.js >= 20 (uses built-in fetch)

No runtime dependencies :)

### Setup

The client authenticates using your Visualping email and password. Ugly, I know.

This is obvious, but use environment variables to avoid hard-coding credentials.

### Examples

#### Quickstart

```
import {
  JobMode,
  OutputMode,
  TargetDevice,
  VisualpingClient,
} from "visualping-client";

async function main() {
  const email = process.env.VISUALPING_EMAIL;
  const password = process.env.VISUALPING_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing VISUALPING_EMAIL or VISUALPING_PASSWORD environment variables"
    );
  }

  const client = new VisualpingClient(email, password);

  // Get user info
  const me = await client.describeUser();
  console.log("Logged in as:", me.emailAddress);

  // Create a job
  const job = await client.createJob({
    url: "https://example.com",
    mode: JobMode.TEXT,
    active: true,
    interval: "60",
    trigger: "0.1",
    target_device: TargetDevice.DESKTOP,
    wait_time: 0,
  });

  console.log("Created job:", job);

  // Fetch job IDs only
  const jobResult = await client.getJobs({
    mode: OutputMode.IDS_ONLY,
  });

  console.log("Job IDs:", jobResult.jobIds);

  // Fetch all jobs filtered by mode
  const jobs = await client.getAllJobs({
    modeFilter: [JobMode.TEXT],
  });

  console.log("Filtered jobs:", jobs);

  // Optional cleanup
  for (const id of jobResult.jobIds) {
      await client.deleteJob(id);
  }
}

main().catch((error) => {
  console.error("Error occurred:");
  if (error instanceof Error) {
    console.error(error.message);
    console.error(error.stack);
  } else {
    console.error(error);
  }
  process.exit(1);
});

```

### Basic Usage

Initialize client

```
const client = new VisualpingClient(
  'user@example.com',
  'password',
  30000 // optional timeout in ms
);
```

User Information

```
// Get current user details
const user = await client.describeUser();

// Get available workspaces
const workspaces = await client.getWorkspaces();
```

Managing Jobs

```
// List jobs with filters
const activeJobs = await client.getJobs({
  activeFilter: true,
  pageSize: 50
});

// Get all jobs (auto-paginated)
const allJobs = await client.getAllJobs();

// Get specific job
const job = await client.getJob(123);

// For business users, include workspaceId
const businessJob = await client.getJob(123, 456);
```

Creating Jobs

```
const newJob = await client.createJob({
  url: 'https://example.com/page',
  description: 'Monitor pricing page',
  mode: JobMode.TEXT,
  active: true,
  interval: '60',      // Check every 60 minutes
  trigger: '0.1',      // Alert on 10% change
  target_device: TargetDevice.DESKTOP,
  wait_time: 0
});
```

Updating Jobs

```
// Update specific fields only
await client.updateJob(123, {
  description: 'New description',
  interval: '30',
  active: false
});
```

Bulk Operations

```
// Pause multiple jobs at once
await client.pauseJobs([123, 456, 789]);
```

Error Handling

```
import { VisualpingApiError } from 'visualping-client';

try {
  await client.getJob(123);
} catch (error) {
  if (error instanceof VisualpingApiError) {
    console.error(`API Error ${error.status}: ${error.message}`);
  }
}
```

### Features

- Automatic Authentication - handles token refresh automatically
- Full TypeScript Support - Complete type definitions for all API endpoints
- Retry Logic - Automatic retries with exponential backoff for transient errors
- Timeout Handling - Configurable request timeouts
- Business Account Support - Full support for workspace and organization features

### Weird Stuff

A collection of weird things from the visualping api

- Sometimes, a jobId is sent as a number and sometimes as a string
- Some fields from the api response are camelCase, and some snake_case. Ie `target_device` and `workspaceId` when creating a new job

### License

This work is licensed under the ISC license.
