# Welcome to CCSync contributing guide <!-- omit in toc -->

Thank you for investing your time in contributing to our project! :sparkles:.

Read our [Code of Conduct](./CODE_OF_CONDUCT.md) to keep our community approachable and respectable.

In this guide you will get an overview of a contribution workflow from opening an issue, creating a PR, reviewing, and merging the PR.

## New contributor guide

To get an overview of the project, read the [documentation of CCSync](https://its-me-abhishek.github.io/ccsync-docs/).

### Issues

#### Create a new issue

If you spot a problem with the docs, [search if an issue already exists](https://github.com/its-me-abhishek/ccsync/issues). If a related issue doesn't exist, you can open a new issue using a relevant issue form.

#### Solve an issue

Scan through our [existing issues](https://github.com/its-me-abhishek/ccsync/issues) to find one that interests you. You can narrow down the search using `labels` as filters. If you find an issue to work on, and after discussion, it comes out to be a valid issue, you are welcome to open a PR with a fix.

### Make Changes

1. Fork the repository.

- Using GitHub Desktop:

  - [Getting started with GitHub Desktop](https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/getting-started-with-github-desktop) will guide you through setting up Desktop.
  - Once Desktop is set up, you can use it to [fork the repo](https://docs.github.com/en/desktop/contributing-and-collaborating-using-github-desktop/cloning-and-forking-repositories-from-github-desktop)!

- Using the command line:
  - [Fork the repo](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo#fork-an-example-repository) so that you can make your changes without affecting the original project until you're ready to merge them.

2. For more information, see the [development guide](https://its-me-abhishek.github.io/ccsync-docs/).

3. Create a new working branch and start with your changes!

### Commit your updates

Commit the changes once you are happy with them.

Please follow these rules or conventions while committing any new changes:

- `feat`: new feature for the user, not a new feature for build script
- `fix`: bug fix for the user
- `docs`: changes to the documentation
- `style`: formatting, missing semi colons, etc
- `refactor`: refactoring production code, eg. renaming a variable
- `test`: adding missing tests, refactoring tests
- `chore`: updating grunt tasks, etc., no production code change
- Run `npx prettier --write .` before commiting so as to adhere to the linting scheme of the project's frontend
- Run `gofmt -w .` before commiting so as to adhere to the linting scheme of the project's backend

### Pull Request

When you're finished with the changes, create a pull request, also known as a PR.

- Don't forget to link PR to issue if you are solving one.
- Enable the checkbox to [allow maintainer edits](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/allowing-changes-to-a-pull-request-branch-created-from-a-fork) so the branch can be updated for a merge.
- If you run into any merge issues, checkout this [git tutorial](https://github.com/skills/resolve-merge-conflicts) to help you resolve merge conflicts and other issues.

### Your PR is merged!

Congratulations :tada::tada:.

Once your PR is merged, your contributions will be publicly visible in [closed PRs](https://github.com/its-me-abhishek/ccsync/pulls?q=is%3Apr+is%3Aclosed).
