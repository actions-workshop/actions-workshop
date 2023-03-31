## Contributing

[fork]: https://github.com/actions-workshop/actions-workshop/fork
[pr]: https://github.com/actions-workshop/actions-workshop/compare
[issue]: https://github.com/actions-workshop/actions-workshop/issues/new

Hi there! We're thrilled that you'd like to contribute to this project. Your help is essential for keeping it great.

## Contributions to the Workshop Content

**Please note that the contents of this workshop (`./docs`) were carefuly crafted by the GitHub Team, and as such we are currently not open for direct contributions there.**

However, if you have ideas on how to improve the Workshop, feel free to [open an issue][issue] and share your idea with us. We'll happily discuss it with you.

## Contributions to the Code

If you'd like to contribute to the codebase by fixing a bug or improving it in any other way, please read the following section.

Contributions to this project are [released](https://help.github.com/articles/github-terms-of-service/#6-contributions-under-repository-license) to the public under the [MIT (for Code) and CC BY-SA 4.0 (Workshop Documentation under ./doc)](LICENSE).

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

### Prerequisites for running and testing code

These are one time installations required to be able to test your changes locally as part of the pull request (PR) submission process.

1. install NodeJS & NPM [through download](https://nodejs.org/en) | [through Homebrew](https://formulae.brew.sh/formula/node)
1. [install golangci-lint](https://golangci-lint.run/usage/install/#local-installation)

### Submitting a pull request

If you see a bug or want to improve the code (anything outside the `./docs` folder), please follow these steps:

1. [Fork][fork] and clone the repository
1. Configure and install the dependencies: `npm install`
1. Make sure the tests pass on your machine: `npm run test`
1. Make sure linter passes on your machine: `npm run lint`
1. Create a new branch: `git checkout -b my-branch-name`
1. Make your change, add tests, and make sure the tests and linter still pass
1. Push to your fork and [submit a pull request][pr]
1. Pat your self on the back and wait for your pull request to be reviewed and merged.

Here are a few things you can do that will increase the likelihood of your pull request being accepted:

- Write tests.
- Keep your change as focused as possible. If there are multiple changes you would like to make that are not dependent upon each other, consider submitting them as separate pull requests.
- Write a [good commit message](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html).

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://help.github.com)
