# New Project Deployment Guide

Use this folder for every new project that should get its own Vercel link.

## Rule

Do not build a new project in the repository root unless it is meant to replace the current root app.

Create each new app in its own folder:

```text
apps/my-new-project
```

Then create a separate Vercel project with:

```text
Git Repository: this repository
Production Branch: main
Root Directory: apps/my-new-project
Build Command: npm run build
Install Command: npm install
Output Directory: leave empty
```

Localhost ports are only for local development. They do not decide what Vercel deploys.

## Creating A New App

Start from the template:

```bash
cp -R apps/_next-template apps/my-new-project
cd apps/my-new-project
npm install
npm run dev -- --port 3002
```

Use a different local port for convenience when multiple apps are running:

```text
root blog: 3000
image_practice: 3001
new apps: 3002, 3003, ...
```

## Vercel Checklist

Before deploying:

```bash
cd apps/my-new-project
npm run build
npm run lint
```

In Vercel, always confirm the Root Directory. This is the setting that prevents one project from replacing another.

