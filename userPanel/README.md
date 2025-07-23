# Zumito User Panel Module

The `userPanel` module provides a user-facing dashboard for the Zumito platform, allowing users to manage their account, view server information, and interact with platform features in a modern, Discord-inspired interface.

## Features

- **User Dashboard:** Overview of user activity and account status.
- **Server List:** Displays servers the user has access to, with navigation and quick actions.
- **Dynamic Navigation:** Integrated with Zumito Framework's navigation system for a seamless experience.
- **Authentication:** Handles user authentication and session management.
- **Views:** Uses EJS templates for dynamic and responsive UI.

## Installation

This module is part of the Zumito ecosystem. To use it, ensure you have `zumito-framework` installed in your project.

```bash
npm install @zumito-team/user-panel-module
```

## Usage

To integrate the `userPanel` module into your Zumito application, instantiate and register it with your main `ZumitoFramework`:

```typescript
import { ZumitoFramework } from "zumito-framework";
import { UserPanelModule } from "@zumito-team/user-panel-module";

new ZumitoFramework({
    // ... other options
    bundles: [{
        path: path.join(__dirname, "node_modules", "@zumito-team", "user-panel-module"),
    }]
    // Other options
})
```

The module will automatically register its services and routes.

## Key Services

- `NavigationService`: Manages navigation elements for the user dashboard.
- `UserAuthService`: Handles authentication and session logic for users.
- `UserViewService`: Responsible for rendering user panel views.

## Routes

Main routes exposed by this module include:

- `/panel`: Main user dashboard.
- `/panel/servers`: List and manage servers.
- `/panel/login`: User login page.
- `/panel/login/callback`: Authentication callback.

## Contribution

To contribute to this module, please follow the Zumito project contribution guidelines.

## License

This project is licensed under the GNU General Public License (GPL).
