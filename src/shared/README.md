# Shared Folder

## Overview
The `shared` folder serves as a central hub for constants, types, and utility functions that are utilized by both the client/render process (Next.js part) and the Electron/main process. This setup ensures consistency and reusability of core components throughout the application.

## What's Inside

- **Types**: Located in the `types/` subfolder, these files define structures that are integral to the application's functionality. Key type files include:
    - `marketplace.ts`: Types for marketplace interactions.
    - `story.ts`: Types for storytelling features.

- **build-key.ts**: Utility for generating unique keys for events and handlers, enhancing the application's security measures.

- **constants.ts**: Repository of constants that are widely used across different parts of the application.

- **enums.ts**: Contains enums such as `KEY` for accessing Electron stores and `ID` for UUIDs used across the application.

- **flags.ts**: Boolean flags, such as `isDevelopment`, `isProduuction` and `isTest`, which help manage environment-specific features and settings.

- **Utility Modules**:
    - `number.ts`: Functions for number manipulation and validation.
    - `object.ts`: Helpers for dealing with object creation and manipulation.
    - `string.ts`: Utilities for string processing and formatting.

## Using Shared Components
Components in the `shared` folder can be seamlessly integrated into both client and Electron parts of the app. Import any module using the TypeScript path alias `@/shared/*`, which simplifies access and maintains clean code organization.

## Documentation
For comprehensive details on each component within the `shared` folder, visit our detailed documentation sections under `/captain/shared/**`. These documents are accessible via the sidebar navigation in our main documentation portal.
