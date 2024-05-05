# Client Folder

## Overview
The `client` folder contains the Next.js application that powers the front end of our application, generating a static site that delivers the core functionalities such as the dashboard, settings, downloads, and marketplace. This folder follows an extended version of Atomic Design, accommodating our unique components and state management needs.

## Atomic Design Extended
Our implementation of atomic design incorporates:
- **Ions**: Non-renderable parts such as Jotai atoms, Day.js configurations for internationalization, and internal React hooks. These components form the underlying functionalities that support state management and theming across the app.
- **Atoms**: UI components that are the foundational building blocks of our user interface, such as buttons and input fields.
- **Molecules**: Composed of one or more atoms and serve as functional groupings for smaller, reusable components.
- **Organisms**: Complex UI components that combine multiple molecules into more significant sections of our app interface.

## Special Features
- **Component Design**: We utilize `@mui/joy` for crafting themable and accessible UI components, with styles provided through our `@captn/theme` package to ensure consistency and native feel across both core and third-party applications.
- **Integration**: Components in the `client` folder exclusively use utilities from the `shared` folder to maintain separation of concerns, particularly avoiding direct interactions with the Electron-specific code to prevent bundling issues.

## Common Tasks
Developers working within the `client` folder typically engage in:
- Enhancing core functionalities like the dashboard, settings, and marketplace.
- Developing and refining internal apps that utilize our advanced search capabilities, ensuring these apps are seamlessly integrated into the overall UI.

## Documentation
For more detailed information on each component within the `client` folder, please refer to our documentation at `/captain/client/**` accessible through the sidebar navigation in our main documentation portal.
