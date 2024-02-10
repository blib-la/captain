# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue,
email, or any other method with the owners of this repository before making a change.

Please note we have a code of conduct, please follow it in all your interactions with the project.

## Pull Request Process

Ensure any install or build dependencies are removed before the end of the layer when doing a build.
Fork the repository and create a new branch (feature/my-feature). Commit changes following the
"conventional-changelog" rules. Do not modify any versions manually. Don't build new versions. Use
the [PULL_REQUEST_TEMPLATE](PULL_REQUEST_TEMPLATE.md).

## Reporting issues

Ensure any install or build dependencies are removed before the end of the layer when doing a build.
Create a new issue (bug/some-bug). Always list "yarn version", "node version". Use the
[ISSUE_TEMPLATE](./ISSUE_TEMPLATE/)s.

## Local Development

### Prerequisites

Before you begin, ensure you have Node.js installed (the version can be found in
[.nvmrc](../.nvmrc)).

### Setting Up Your Environment

1. **Clone the Repository**: Start by cloning the
   [captain repository](https://github.com/blib-la/captain) to your local machine.

    ```bash
    git clone https://github.com/blib-la/captain
    cd captain
    ```

2. **Install Dependencies**: Install all necessary dependencies by running:

    ```bash
    npm i
    ```

3. **Python Environment**: Captain requires an embedded Python environment. To set this up:

    - Clone the [embed-my-python](https://github.com/blib-la/embed-my-python) repository to a
      location of your choice.

    - For Windows users, run the following script to create the "python-embedded" folder required by
      Captain:

        ```powershell
        .\embed-my-python-win.ps1 -v 3.10.11 -r \full\path\to\captain\requirements.txt -d \full\path\to\captain\resources\python-embedded -a ..\.
        ```

    **Note**: It's crucial to remove any existing `python-embedded` folder in
    [captain/resources](../resources/) before running the script. This ensures your environment
    matches the defined dependencies in [captain/requirements.txt](../requirements.txt).

## Community Communication

To foster a vibrant and supportive community, we have set up a Discord server for all contributors
and users of the project. This server is a great place for asking questions, sharing feedback, and
connecting with fellow contributors. If you're interested in joining the discussion and contributing
to the project, please join our Discord server using the following invite link:
[Join our Discord](https://discord.com/invite/m3TBB9XEkb).

We encourage all contributors to participate and collaborate within this community space. Whether
you're seeking help with setting up your development environment, discussing potential features, or
sharing your contributions, our Discord server is the ideal place to engage with the project's
community.
