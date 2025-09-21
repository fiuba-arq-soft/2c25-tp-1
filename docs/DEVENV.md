# Development Environment Setup with Devenv

This project uses [devenv](https://devenv.sh/) to manage the development environment, which provides all necessary tools including Emacs, LaTeX, PlantUML, and more.

## Prerequisites

### Installing Nix

First, install Nix using the Determinate Nix Installer for a reliable installation experience:

```bash
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
```

This installer handles various system configurations automatically and is recommended over the official Nix installer.

After installation, restart your shell or run:

```bash
source ~/.bashrc  # or your shell's config file
```

### Installing Devenv

Once Nix is installed, install devenv:

```bash
nix-env -iA devenv -f https://github.com/cachix/devenv/archive/v0.5.tar.gz
```

## Activating the Environment

To activate the development environment for this project:

```bash
devenv shell
```

This will set up all required dependencies and tools automatically.

## What's Included

The devenv environment includes:
- Emacs with Org Mode support
- LaTeX distribution
- PlantUML for diagram generation
- Graphviz for DOT diagrams
- All necessary build tools