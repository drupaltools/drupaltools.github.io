<img src="img/logo.png" align="left" alt="Drupaltools logo">

# DrupalTools

## About

Project [drupaltools.github.io](https://drupaltools.github.io/), a list of open-source tools used for Drupal development and other Drupal related tasks.

Initially based on the this [Google Sheets](https://docs.google.com/spreadsheets/d/1EWmxQMMekc0fMoMl16HyLt0i8yCRBT5wAVuy66Bi4kI)
which is now deprecated!

## Contributing

Missing a tool here? Just fork the repo and add your tool as a `<name>.yml` in the `_data/projects` folder.

Make sure to follow the following rules:

 - **Open Source:** The generator must have a public repository on Github, Gitlab, Bitbucket etc that we can link to and pull in stats from.
 - **Stick to the format:** Fill out all the same fields as the other tools in `source/projects`.
 - **Short description:** Keep all the details for the body text, keep the description for the overview page short and sweet.
 - Respect the **[Code of Conduct](blob/master/CODE_OF_CONDUCT.md)**.

## Running locally

Drupaltools is built with Jekyll, Bundler and Liquid. To install and run locally:

```
gem install jekyll bundler
git clone https://github.com/theodorosploumis/drupaltools.git
cd drupaltools
bundle install
bundle exec jekyll serve
```

## License
This project is licensed under the [MIT license](http://opensource.org/licenses/MIT).

[Drupal](https://www.drupal.org) is a [registered trademark](http://drupal.com/trademark) of [Dries Buytaert](http://buytaert.net/).
