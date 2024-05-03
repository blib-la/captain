# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```
npm i
```

### Local Development

```
npm start
```

This command starts a local development server and opens up a browser window. Most changes are
reflected live without having to restart the server.

### Build

First you have to create the `docs` from Captain inside the root of Captain itself, not in
`homepage`:

```
cd ..
npm run typedoc:generate
```

Then you can go back into `homepage` and build it:

```
npm run build
```

This command generates static content into the `build` directory and can be served using any static
contents hosting service.

### Deployment

Is done via a [GitHub workflow](../.github/workflows/publish-homepage.yml).
