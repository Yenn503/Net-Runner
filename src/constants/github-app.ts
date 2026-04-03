export const PR_TITLE = 'Add Net-Runner GitHub Workflow'

export const GITHUB_ACTION_REPO =
  process.env.NETRUNNER_GITHUB_ACTION_REPO?.trim() || null
export const GITHUB_ACTION_SETUP_DOCS_URL =
  process.env.NETRUNNER_GITHUB_ACTION_DOCS_URL?.trim() ||
  'https://docs.netrunner.com/integrations/github-actions'
export const GITHUB_ACTION_SECRET_NAME = 'NETRUNNER_API_KEY'
const GITHUB_ACTION_USES_LINE = GITHUB_ACTION_REPO
  ? `uses: ${GITHUB_ACTION_REPO}@v1`
  : '# Configure NETRUNNER_GITHUB_ACTION_REPO before using this workflow'

export const WORKFLOW_CONTENT = `name: Net-Runner

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]

jobs:
  netrunner:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@netrunner')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@netrunner')) ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@netrunner')) ||
      (github.event_name == 'issues' && (contains(github.event.issue.body, '@netrunner') || contains(github.event.issue.title, '@netrunner')))
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
      issues: read
      id-token: write
      actions: read # Required for Net-Runner to read CI results on PRs
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Run Net-Runner
        id: netrunner
        ${GITHUB_ACTION_USES_LINE}
        with:
          api_key: \${{ secrets.${GITHUB_ACTION_SECRET_NAME} }}

          # This is an optional setting that allows Net-Runner to read CI results on PRs
          additional_permissions: |
            actions: read

          # Optional: Give a custom prompt to Net-Runner. If this is not specified, Net-Runner will perform the instructions specified in the comment that tagged it.
          # prompt: 'Update the pull request description to include a summary of changes.'

          # Optional: Add agent arguments to customize behavior and configuration
          # See the Net-Runner action documentation for available options
          # netrunner_args: '--allowed-tools Bash(gh pr:*)'

`

export const PR_BODY = `## 🤖 Installing Net-Runner GitHub App

This PR adds a GitHub Actions workflow that enables Net-Runner integration in our repository.

### What is Net-Runner?

[Net-Runner](https://github.com/Yenn503/Net-Runner) is an AI coding agent that can help with:
- Bug fixes and improvements  
- Documentation updates
- Implementing new features
- Code reviews and suggestions
- Writing tests
- And more!

### How it works

Once this PR is merged, we'll be able to interact with Net-Runner by mentioning @netrunner in a pull request or issue comment.
Once the workflow is triggered, Net-Runner will analyze the comment and surrounding context, and execute on the request in a GitHub action.

### Important Notes

- **This workflow won't take effect until this PR is merged**
- **@netrunner mentions won't work until after the merge is complete**
- The workflow runs automatically whenever Net-Runner is mentioned in PR or issue comments
- Net-Runner gets access to the entire PR or issue context including files, diffs, and previous comments

### Security

- Our Net-Runner API key is securely stored as a GitHub Actions secret
- Only users with write access to the repository can trigger the workflow
- All Net-Runner runs are stored in the GitHub Actions run history
- Net-Runner's default tools are limited to reading/writing files and interacting with our repo by creating comments, branches, and commits.
- We can add more allowed tools by adding them to the workflow file like:

\`\`\`
allowed_tools: Bash(npm install),Bash(npm run build),Bash(npm run lint),Bash(npm run test)
\`\`\`

There's more information in the hosted GitHub Action documentation.

After merging this PR, let's try mentioning @netrunner in a comment on any PR to get started!`

export const CODE_REVIEW_PLUGIN_WORKFLOW_CONTENT = `name: Net-Runner Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]
    # Optional: Only run on specific file changes
    # paths:
    #   - "src/**/*.ts"
    #   - "src/**/*.tsx"
    #   - "src/**/*.js"
    #   - "src/**/*.jsx"

jobs:
  netrunner-review:
    # Optional: Filter by PR author
    # if: |
    #   github.event.pull_request.user.login == 'external-contributor' ||
    #   github.event.pull_request.user.login == 'new-developer' ||
    #   github.event.pull_request.author_association == 'FIRST_TIME_CONTRIBUTOR'

    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
      issues: read
      id-token: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Run Net-Runner Review
        id: netrunner-review
        ${GITHUB_ACTION_USES_LINE}
        with:
          api_key: \${{ secrets.${GITHUB_ACTION_SECRET_NAME} }}
          prompt: '/code-review:code-review \${{ github.repository }}/pull/\${{ github.event.pull_request.number }}'
          # See the Net-Runner action documentation for available options

`
