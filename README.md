<img src="img/logo.png" align="left" alt="Drupaltools logo">

# DrupalTools

Project [drupaltools.github.io](https://drupaltools.github.io/), a list of open-source tools used for
Drupal development and other Drupal related tasks.

## Contributing

Missing a tool here? Just fork the repo and add your tool as a `<name>.yml` in the `_data/projects` folder.

```yaml
# _data/projects/example-tool.yml
name: Example Tool
year_created: 2024
source: https://github.com/example/example-tool
homepage: https://example.com
description: |
  A single sentence that will appear in the listings.
requires:
  - php
drupal_versions:
  - 10
category:
  - devops
recommended: true
```

Use the same keys shown above so the site build picks up the metadata correctly.
Optional keys such as `docs`, `logo`, or `similar` can be added when the information is available.

Make sure to follow the following rules:

 - **Open Source:** The tool must have a public repository on Github, Gitlab, Bitbucket etc that we can link to and pull in stats from.
 - **Stick to the format:** Fill out all the same fields as the other tools in `_data/projects`.
 - **Short description:** Keep all the details for the body text, keep the description for the overview page short and sweet.
 - Respect the **[Code of Conduct](blob/master/CODE_OF_CONDUCT.md)**.

## Running locally

Drupaltools is built with Jekyll, Bundler and Liquid. To install and run locally:

```bash
gem install jekyll bundler
git clone https://github.com/theodorosploumis/drupaltools.git
cd drupaltools
bundle install
bundle exec jekyll serve
```

## MCP Server

This repository includes an MCP (Model Context Protocol) server that provides programmatic access to the Drupal tools database. See [mcp-server/README.md](./mcp-server/README.md) for details.

### Quick Start

```bash
npm install
npm run mcp
```

The MCP server provides three tools:
- `list_tools`: List all tools with optional category filtering
- `search_tools`: Semantic search for tools
- `get_tool`: Get detailed information about a specific tool

Or just open in Gitpod!

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/drupaltools/drupaltools.github.io)

## Similar tools

See also:

- https://jakzal.github.io/toolbox

## License

This project is licensed under the [MIT license](LICENSE.md).

[Drupal](https://www.drupal.org) is a [registered trademark](http://drupal.com/trademark) of [Dries Buytaert](http://buytaert.net/).
