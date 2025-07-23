
# Zumito Admin Module

The `admin` module is the central administration panel for the Zumito platform. It provides a user interface to manage various system settings and aspects, including superadmin management and dashboard visualization.

## Features

-   **Dashboard:** An overview of system activity and status.
-   **Superadmin Management:** Add and remove users with superadmin privileges.
-   **Dynamic Navigation:** Integration with Zumito Framework's navigation system for a consistent user experience.
-   **Authentication:** Handles authentication for access to the admin panel.
-   **Views:** Renders views using EJS for a dynamic user interface.

## Installation

This module is part of the Zumito ecosystem. To use it, make sure you have `zumito-framework` installed in your project.

```bash
npm install @zumito-team/admin-module
```

## Usage

To integrate the `admin` module into your Zumito application, instantiate and register it with your main `ZumitoFramework`:

```typescript
import { ZumitoFramework } from "zumito-framework";
import { AdminModule } from "@zumito-team/admin-module";

new ZumitoFramework({
    // ... other options
    bundles: [{
        path: path.join(__dirname, "node_modules", "@zumito-team", "admin-module"),
    }]
    // Other options
})
```

The module will automatically register its services and routes.

## Key Services

The `admin` module uses and registers the following services:

-   `NavigationService`: Manages dashboard navigation elements.
-   `AdminAuthService`: Handles authentication logic for the admin panel.
-   `AdminViewService`: Responsible for rendering admin panel views.

## Routes

The main routes exposed by this module include:

-   `/admin`: Main dashboard.
-   `/admin/superadmins`: Superadmin management.
-   `/admin/login`: Admin login page.
-   `/admin/login/callback`: Authentication callback.

## Contribution

To contribute to this module, please follow the Zumito project contribution guidelines.

## License

This project is licensed under the GNU General Public License (GPL).
