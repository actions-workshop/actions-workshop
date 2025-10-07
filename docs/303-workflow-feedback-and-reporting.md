# Workflow Feedback and Reporting

GitHub Actions provides multiple ways to give feedback from workflows back to developers.  
This includes annotations in the UI, job summaries, status badges, and uploading artifacts for inspection.

## 1 — Annotations (Workflow Commands)

Annotations provide inline messages in the GitHub UI and provide a quick way for developers to see that content.  

```bash
echo "::error file=app.js,line=10,col=5::Missing semicolon"
echo "::warning::This is a warning"
echo "::notice::FYI, build took longer than usual"
```

These can be used in a workflow with a run command as follows: 

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: echo "::error file=index.js,line=1::Example error"
```

Annotations appear directly in the **Checks** tab of the pull request.  

## 2 — Job Summaries

Job summaries let you output Markdown to a special summary panel for each job.  Again this is another way to raise awareness of data without needing to look in the Actions logs.  

```yaml
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - name: Write summary
        run: |
          echo "### Test Results" >> $GITHUB_STEP_SUMMARY
          echo "- Passed: 42" >> $GITHUB_STEP_SUMMARY
          echo "- Failed: 0" >> $GITHUB_STEP_SUMMARY
```

This creates a rich Markdown that simplifies awareness of status or outputs data relevant to the actions run.  Full documentation on job summaries is available [here](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#adding-a-job-summary).  Anything you can do in Markdown you can do in a job summary.  An example can be seen in the video in this [Copilot usage action](https://github.com/austenstone/copilot-usage)

## 3 — Status Badges

For CI/CD workflows, status badges make it easy to see overall status directly in your README.  Workflows automatically create status badges and they are easy to include in markdown.  Below is the format needed to add to your readme.  Note that badges are updated dynamically based on the latest run. 

```markdown
![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)
```

## 4 — Uploading Artifacts

Artifacts let you persist build outputs or logs.  This allows you to pass content from one job to another.  For example, a build job may pass it's content to a deploy job.  Logs may be persisted for debugging.  Test reports may be uploaded for inspection. 

To upload an artifact:  

```yaml
steps:
  - uses: actions/upload-artifact@v4
    with:
      name: coverage-report
      path: coverage/
```

To download in another job:

```yaml
steps:
  - uses: actions/download-artifact@v4
    with:
      name: coverage-report
```

Artifacts are stored for a limited time (90 days by default) and can be downloaded from the Actions UI or via the API.  It is important to note that you pay per GB-month for artifact storage beyond the [free usage](https://docs.github.com/en/billing/concepts/product-billing/github-actions#free-use-of-github-actions).  You may want to set a custom retention period to control costs.  This can be between 1-90 days for public repos and 1-400 days for private repos.  Note changing the retention period only affects new artifacts, not existing ones.  

Here is an example of setting a custom retention period of 5 days using `retention-days`:

```yaml
steps:
  - uses: actions/upload-artifact@v4
    with:
      name: my-artifact
      path: my_file.txt
      retention-days: 5
```

Note it is also possible to set a default retention period for all artifacts at the repo or organization level. 

> It is important to note that artifacts are not a secure way to pass sensitive data.  Artifacts are stored unencrypted and can be downloaded by anyone with read access to the repository.  For sensitive data, consider using encrypted secrets or other secure storage mechanisms.

## 5 — Lab: Step Summary, Artifacts, and Badges

In this lab we will enhance our workflow by adding step summaries, uploading test artifacts, setting a retention period, and including status badges.

Create a new actions workflow that includes a test summary with artifacts at `.github/workflows/test-report.yml`:

```yaml
name: Test Report Lab

on: 
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx vitest run --reporter=json --outputFile=report.json 

      - uses: actions/upload-artifact@v4
        with:
          name: test-report
          path: report.json
          retention-days: 7

      - name: Write summary
        run: |
          echo "### Test Report" >> $GITHUB_STEP_SUMMARY
          echo "See attached artifact for full details" >> $GITHUB_STEP_SUMMARY
```

After committing and pushing, manually trigger the workflow using the "Run workflow" button in the Actions tab.

Open the job summary tab and see your test summary.  Download the artifact and inspect the test report.

**Add a Status Badge to your README**

Add the following markdown to your README, replacing `OWNER`, `REPO`, and `test-report.yml` with your repository details:

```markdown
![Test Report](https://github.com/OWNER/REPO/actions/workflows/test-report.yml/badge.svg)
```

This badge will dynamically reflect the status of your latest workflow run.`

## Conclusion

Effective workflow feedback and reporting are essential for maintaining high-quality CI/CD pipelines and improving developer experience. Annotations, job summaries, status badges, and artifacts help teams surface important information, share results, and debug issues quickly.
