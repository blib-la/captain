# Electron Folder

## Overview
This folder serves as the main process for the Electron part of our application. It's responsible for running background scripts, registering installed apps, populating the vector database for search capabilities, and managing deep links.

## Key Components

### IPC (Inter-Process Communication)
- **Overview**: IPC facilitates communication between the Electron main process and the render processes.
- **ipc/sdk/**: Contains handlers that are exposed to third-party apps, allowing for extended functionality.
- **ipc/global**: Manages window operations like minimize, maximize, and close. It also supports optional features for third-party apps such as language and theme switching (light, dark, system).

### Services
- **General**: Services in this folder perform core functionalities such as managing downloads and conducting searches within the vector database.
- **Download Manager**: Handles all download operations efficiently and reliably.
- **Vector Search**: Utilizes Qdrant for powerful search capabilities within our app.
- **Logging**: Implemented via `electron-log`, designed to capture detailed logs including stack traces and to support the serialization of complex objects for easier debugging.

## Integration
The `electron` folder operates independently but makes extensive use of shared resources from the `shared` folder, including types and utility functions. It does not interact directly with the `client` folder.

## Common Tasks
Developers working in this folder might set up IPC handlers, integrate Python scripts via Node wrappers, or manage service configurations. This area is pivotal for enhancing app functionalities and integrating various external scripts and services.

## Dependencies
Key dependencies include npm packages such as `transformers.js`, `execa`, and `fs-extra`. These are crucial for handling file system operations and managing child processes.

## Documentation
For more detailed information on each component within the `electron` folder, please refer to the documentation available at `/captain/electron/**` through the sidebar navigation in our main documentation portal.
