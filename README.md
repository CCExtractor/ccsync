<div align="center">
  <a href="https://github.com/its-me-abhishek/ccsync">
    <img src="https://github.com/its-me-abhishek/ccsync/blob/main/frontend/src/assets/logo.jpg" alt="CCSync Logo"/>
  </a>
  <h3>Web Interface + Sync Server for Taskwarrior 3.0 and Higher</h3>

  <p>
    A self-hosted solution for syncing and managing your tasks anywhere, anytime.
  </p>

  <p>
    <a href="https://github.com/its-me-abhishek/ccsync/stargazers">
      <img src="https://img.shields.io/github/stars/its-me-abhishek/ccsync?logo=github&color=gold&style=for-the-badge" alt="Stars" />
    </a>
    <a href="https://github.com/its-me-abhishek/ccsync/forks">
      <img src="https://img.shields.io/github/forks/its-me-abhishek/ccsync?logo=github&color=orange&style=for-the-badge" alt="Forks" />
    </a>
    <a href="https://github.com/its-me-abhishek/ccsync/issues">
      <img src="https://img.shields.io/github/issues/its-me-abhishek/ccsync?logo=github&color=red&style=for-the-badge" alt="Issues" />
    </a>
    <a href="https://github.com/its-me-abhishek/ccsync/pulls">
      <img src="https://img.shields.io/github/issues-pr/its-me-abhishek/ccsync?logo=github&color=purple&style=for-the-badge" alt="PRs" />
    </a>
    <a href="https://github.com/its-me-abhishek/ccsync/commits/main">
      <img src="https://img.shields.io/github/last-commit/its-me-abhishek/ccsync?logo=git&color=brightgreen&style=for-the-badge" alt="Last Commit" />
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/github/license/its-me-abhishek/ccsync?color=blue&style=for-the-badge" alt="License" />
    <img src="https://img.shields.io/badge/contributions-welcome-brightgreen?style=for-the-badge&logo=github" alt="Contributions Welcome" />
  </p>

  <p>
    <a href="https://its-me-abhishek.github.io/ccsync-docs/">📘 Documentation</a> •
    <a href="https://abhishek31.medium.com/">📝 Blogs</a> •
    <a href="https://github.com/its-me-abhishek/gsoc-report">📄 GSoC Report</a> •
    <a href="https://www.youtube.com/watch?v=8UhAeM8iWzQ">🎥 Setup Video</a>
  </p>
</div>

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Features](#features)
- [Architecture](#architecture)
- [Development Setup](#development-setup)
- [Contributing](#contributing)
- [License](#license)

## Overview

**CCSync** is a web UI and API that synchronizes your [Taskwarrior](https://taskwarrior.org/) tasks across all your clients using a [`taskchampion-sync-server`](https://github.com/GothenburgBitFactory/taskchampion-sync-server).

Whether you prefer the **CLI**, **Web Frontend**, or **Flutter Mobile App**, CCSync keeps everything in sync efficiently and securely.

## Screenshots

<img src="./assets/01_landing.png">
<img src="./assets/02_landing.png">
<img src="./assets/03_landing.png">
<img src="./assets/04_landing.png">
<img src="./assets/05_landing.png">
<img src="./assets/01_home.png">
<img src="./assets/02_home.png">
<img src="./assets/03_home.png">
<img src="./assets/04_home.png">
<img src="./assets/01_backend_docs.png">
<p align="center">
  <table align="center">
    <tr>
      <td><img src="./assets/01_home_mobile.png" width="250"></td>
      <td><img src="./assets/02_home_mobile.png" width="250"></td>
    </tr>
    <tr>
      <td><img src="./assets/03_home_mobile.png" width="250"></td>
      <td><img src="./assets/04_home_mobile.png" width="250"></td>
    </tr>
  </table>
</p>

## Features

- **Task Management** — Create, read, update, and delete tasks seamlessly.
- **Cross-Platform Sync** — Keep all Taskwarrior 3.0+ clients in sync automatically.
- **RESTful API** — Manage and query tasks programmatically.
- **Web Frontend** — Clean and responsive UI for easy task handling.
- **Mobile Integration** — Compatible with the [Taskwarrior Flutter App](https://github.com/CCExtractor/taskwarrior-flutter).
- **Backend Commands** — Full control via Taskwarrior-compatible commands.

## Architecture

CCSync is composed of **three core modules**:

1. **Backend** — The REST API and logic layer that communicates with Taskwarrior clients.
2. **Web Frontend** — A modern web UI that stores and manages tasks in-browser.
3. **Taskchampion Sync Server** — In order to sync tasks with you Taskwarrior instances, CCSync by default uses the offical [Taskchampion sync server image](https://github.com/GothenburgBitFactory/taskchampion-sync-server) to sync tasks.

📖 Learn more in the [official documentation](https://its-me-abhishek.github.io/ccsync-docs/).

## Development Setup

Want to contribute or run CCSync locally? We've made it easy!

### Quick Start with Tmux (Recommended)

Run all services (backend, frontend, and sync server) in a single command:

```bash
./development/setup.sh
```

This will start all three services in separate tmux panes. See [development/README.md](development/README.md) for detailed setup instructions, prerequisites, and troubleshooting.

### Manual Setup

Alternatively, you can run each service separately:

- **Backend**: See [backend/README.md](backend/README.md)
- **Frontend**: See [frontend/README.md](frontend/README.md)
- **Full Stack**: Use `docker-compose up`
- **Sync Server**: Use `docker-compose up syncserver`

## Testing with Postman

1. Open **Postman**.
2. Click **Import** → Select `ccsync.postman_collection.json`.
3. Modify the body fields and start testing!

## Contributing

We welcome all type of contributions!  
Check out the [Contributing Guidelines](CONTRIBUTING.md) and raise issues or PRs.

<p align="center">
  <img src="https://img.shields.io/badge/PRs-Welcome-blueviolet?style=for-the-badge&logo=github" alt="PRs Welcome" />
</p>

## Community

Join discussions and get support on **Zulip** 👇  
[![Chat on Zulip](https://img.shields.io/badge/Chat%20on-Zulip-9146FF?style=for-the-badge&logo=zulip)](https://ccextractor.org/public/general/support/)

## License

Licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<div align="center">

🔝 [Back to Top](#table-of-contents)

</div>
