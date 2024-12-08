<a href="https://github.com/its-me-abhishek/ccsync">
  <img src="https://github.com/its-me-abhishek/ccsync/blob/main/frontend/src/assets/logo.jpg" alt="CCSync">
</a>

</h1>
<h4 align="center">Web interface + Sync server for Taskwarrior 3.0 and higher</h4>
<p align="center">
    <a href="https://github.com/its-me-abhishek/ccsync/commits/main">
    <img src="https://img.shields.io/github/last-commit/its-me-abhishek/ccsync.svg?style=flat-square&logo=github&logoColor=white"
         alt="GitHub last commit"></a>
    <a href="https://github.com/its-me-abhishek/ccsync/pulls">
    <img src="https://img.shields.io/github/issues-pr-raw/its-me-abhishek/ccsync?style=flat-square&logo=github&logoColor=white"
         alt="GitHub pull requests"></a>
    <a href="https://github.com/its-me-abhishek/ccsync/pulls?q=is%3Apr+is%3Aclosed">
    <img src="https://img.shields.io/github/issues-pr-closed-raw/its-me-abhishek/ccsync?style=flat-square&logo=github&logoColor=white"
         alt="Closed pull requests"></a>
    <img src="https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/its-me-abhishek/ccsync/main/frontend/coverage-report.json&query=$.frontend&label=frontend coverage"
          alt="Dynamic JSON Badge" >

</p>
<p align="center">
  <a href="">Website</a> •
  <a href="https://its-me-abhishek.github.io/ccsync-docs/">Documentation</a> •
  <a href="https://abhishek31.medium.com/">Blogs</a> •
  <a href="https://github.com/its-me-abhishek/gsoc-report">GSoC Report</a> •
  <a href="https://www.youtube.com/watch?v=8UhAeM8iWzQ">Setup Video</a>
</p>

---

# CCSync

CCSync is a web UI and API solution designed to facilitate the retrieval and synchronization of tasks from a [`taskchampion-sync-server`](https://github.com/GothenburgBitFactory/taskchampion-sync-server) container. It provides a seamless experience for managing tasks across all Taskwarrior 3.0 (and higher) clients, whether using the Taskwarrior CLI, the web frontend, or the Taskwarrior Flutter app.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

## Overview

During the development of CCSync, the primary focus was placed on creating a backend that provides a series of commands capable of interacting with the Taskwarrior client on the user's system. These commands enable users to create, read, update, or delete tasks directly from the web frontend, or the Taskwarrior Flutter app. The CCSync API ensures these tasks are synchronized across all Taskwarrior clients connected to the `taskchampion-sync-server`.

## Features

- **Task Management**: Create, read, update, and delete tasks using Taskwarrior CLI, a web UI, or the Taskwarrior Flutter app.
- **Cross-Platform Synchronization**: Synchronize tasks across all Taskwarrior 3.0+ clients.
- **API Integration**: RESTful API to interact with tasks programmatically.
- **User-Friendly Web UI**: Manage tasks through a web-based user interface.
- **Flutter App Integration**: Seamless integration with the Taskwarrior Flutter app for mobile task management.
- **Backend Commands**: A comprehensive set of backend commands to interact with Taskwarrior clients.

## Architecture

CCSync comprises three main components:

1. **Backend**: The main server-side component that interfaces with Taskwarrior clients, performs operations, and provides a RESTful API.
2. **Web Frontend**: A user-friendly web interface built for task management, and credentials retreival.
3. **Taskwarrior Flutter App**: The mobile app that allows users to manage tasks on the go, fully integrated with the CCSync API.

For more details, please check out the [documentation](https://its-me-abhishek.github.io/ccsync-docs/).


## Contributing

We welcome contributions to CCSync! Please read our [Contributing Guidelines](CONTRIBUTING.md) to get started. Please raise an issue for any query, bug fix, or a feature request.

## Community

We would love to hear from you! You may join the CCExtractor community through Slack:

[![Slack](https://img.shields.io/badge/chat-on_slack-purple.svg?style=for-the-badge&logo=slack)](https://ccextractor.org/public/general/support/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
