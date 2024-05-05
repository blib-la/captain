# Atoms Folder

## Overview
The Atoms folder houses the foundational UI elements used throughout the client application. These elements are the simplest individual units within our design system, designed for high reusability and consistency across various parts of the application.

## Contents
- **Flags**: Simplified country flags as SVGs, integral for international representations.
- **i18n-Link**: A component that wraps `next/link` to support internationalized routing seamlessly.
- **Icons**: Custom icons using `mui SvgIcon` that extend beyond the offerings of `@mui/icons-material`.
- **Image**: A styled `next/image` component configured with a default aspect ratio of 1 (square), enhancing visual consistency.
- **Logo**: Includes proprietary logos such as the Blibla and Captain logos, used across the application for branding.
- **Lottie-Player**: A wrapper for `@lottiefiles/react-lottie-player`, providing rich, animated graphics.
- **Screen-Reader-Only**: Utilities designed to enhance accessibility by making certain elements perceptible only to screen readers.

## Usage
Atoms are the building blocks for more complex components and are used to maintain a consistent design and functionality throughout the app. While they currently reside locally within the project, plans are in place to migrate many of these components to our `@captn/*` packages to standardize and streamline their use across different projects and third-party applications.

## Future Updates
Developers should be aware that several atoms are slated for migration to our centralized packages, which will affect how they are imported and used in future application updates. This transition is part of our ongoing efforts to enhance modularity and reusability.
