# Governance: Security, Compliance & Workflow Enforcement

As automation and CI/CD pipelines become central to software delivery, governance ensures that your workflows are secure, compliant, and follow organizational best practices. This lab covers key governance features in GitHub Actions, including SLSA Level 3, SBOMs, artifact attestations, and repository rulesets to enforce workflow and collaboration standards.

## 1 — SLSA Level 3, SBOMs & Artifact Attestations

**SLSA (Supply-chain Levels for Software Artifacts)** is a framework for securing software supply chains.  It's purpose is to prevent tampering, ensuring traceability, and provide guarantees about how software artifacts are built and delivered.  This helps defend against threats such as unauthorized code changes, compromised build environments, and dependency attacks. 

SLSA Level 3 requires:

- **Builds run on an ephemeral environment** (GitHub-hosted runners)
- **Cryptographically signed provenance and attestation** for build artifacts
  - Metadata about how, when, and by whom the artifact was built

Not directly required but highly recommended:
- **SBOMs (Software Bill of Materials)**: A manifest of all components and dependencies in your software, critical for vulnerability management and compliance.

**Why is this important?**
- Enables traceability for every build and release
- Facilitates rapid response to security incidents (e.g., dependency vulnerabilities)
- Meets compliance requirements for regulated industries

Follow these steps to put governance concepts into practice in your own repository.

> IMPORTANT: To generate attestations, you must have a GitHub Enterprise Cloud plan or be part of an organization that has one.  Alternatively attestations do work if your repository is public on a personal account.

First, we will configure a basic workflow on a GitHub-hosted runner to ensure builds are isolated and ephemeral.  We will add steps to generate an SBOM to include all project dependencies as well as generate build provenance for our artifact and attestation for our SBOM. These features are available natively in GitHub Actions via the `actions/attest-build-provenance` and `actions/attest-sbom` actions.

Create `.github/workflows/governance.yml` with the following content:
```yaml
name: Governance - Build, Test & Attest

on:
  push:
  pull_request:
  workflow_dispatch:

permissions:
  id-token: write
  contents: read
  attestations: write

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - name: Set up Node.js
        uses: actions/setup-node@v5
        with:
          node-version: '24'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Run tests
        run: npm test

      # Create a build artifact (zip the dist folder)
      - name: Create build artifact
        run: |
          cd dist
          zip -r ../build-artifact.zip .
          cd ..

      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          format: 'cyclonedx-json'
          output-file: 'sbom.json'
          path: 'dist'

      # Generate artifact attestation for build provenance
      - name: Generate artifact attestation
        uses: actions/attest-build-provenance@v3
        with:
          subject-path: 'build-artifact.zip'

      # Generate SBOM attestation
      - name: Generate SBOM attestation
        uses: actions/attest-sbom@v2
        with:
          subject-path: 'build-artifact.zip'
          sbom-path: 'sbom.json'

      # Upload build artifact
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: build-artifact
          path: build-artifact.zip

      # Upload SBOM
      - name: Upload SBOM
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.json
```

Now commit and push your changes to trigger the workflow.  While it is running, review the workflow file to understand the steps taken.  After it completes, you should see the build artifact and SBOM uploaded as artifacts in the workflow run.

> For reference, GitHub's documentation on artifact attestation is available [here](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)

At this point you can verify the attestations using the GitHub CLI.  First, download the build artifacts (binary and SBOM) from the workflow run, then run the following commands to verify build provenance while replacing `OWNER/REPOSITORY_NAME` with your actual repository:

```bash
# Download the artifacts for the 'Governance' workflow
gh run list --limit 5
gh run download <run-id> -n build-artifact
gh run download <run-id> -n sbom

gh attestation verify build-artifact.zip -R OWNER/REPOSITORY_NAME
# Note in a codespace you can can use the GITHUB_REPOSITORY environment variable
# gh attestation verify build-artifact.zip -R $GITHUB_REPOSITORY

# Verify SBOM attestation (CycloneDX format):
 gh attestation verify build-artifact.zip -R OWNER/REPOSITORY_NAME --predicate-type "https://cyclonedx.org/bom" 

# View detailed SBOM information in JSON format:
gh attestation verify build-artifact.zip \
  -R OWNER/REPOSITORY_NAME \
  --predicate-type https://cyclonedx.org/bom/v1.6 \
  --format json \
  --jq '.[].verificationResult.statement.predicate'
```

> Note: The `gh` CLI commands assume you have the GitHub CLI installed and authenticated. You can install it from [here](https://cli.github.com/).

There commands above will verify the signatures and integrity of the artifacts including: 

* Build provenance: Confirms the artifact was built by your specific GitHub Actions workflow
* SBOM attestation: Confirms the SBOM accurately describes the contents of the artifact
* Cryptographic signatures: Ensures the artifact and SBOM are authentic and have not been tampered with since creation
* Workflow identity: Verifies the artifact was produced by the intended workflow in your repository

Clean up the downloaded artifacts from your local machine.

```bash
rm build-artifact.zip sbom.json
```

## 2 — Enforcing Workflows and Compliance with Repository Rulesets

**Repository rulesets** allow you to enforce that certain workflows must run before code is merged or released. For example, you can require that a security scan or build workflow completes successfully before allowing a pull request to be merged.  In addition, you can prevent direct pushes to protected branches (like `main`) from bypassing important checks. 

Repository rulesets can be set at the repository, organization, or enterprise level to enforce consistent policies across multiple repositories.  In this lab we will set a ruleset at the repository level.

In this lab we will create a ruleset to require a  `governance-check.yml` workflow to run and pass before allowing merges to the `main` branch.

First create a simple workflow that will be required to run.  Create `.github/workflows/governance-check.yml` with the following content:

```yaml
name: Simple Governance Check

on:
  push:
  pull_request:
  workflow_dispatch:
    inputs:
      approve:
        description: 'Approve this workflow run'
        required: false
        default: 'false'
        type: choice
        options:
        - 'false'
        - 'true'

jobs:
  approval-gate:
    runs-on: ubuntu-latest
    steps:
      - name: Check approval
        run: |
          if [ "${{ github.event.inputs.approve }}" = "true" ]; then
            echo "✅ Workflow approved via manual dispatch"
          else
            echo "❌ Workflow not approved - use workflow_dispatch with approve=true to pass"
            exit 1
          fi
```

Note all this is doing is failing by default to showcase the ruleset enforcement.  

Commit and Push this workflow.  Note the execution on push will fail.  This is expected.  Manually trigger the workflow once and set the `Approve this workflow run` to `true` to confirm it runs and passes.

Now we will create a ruleset to require this workflow to run and block our pull request from being merged.

1. In GitHub.com, go to your repository’s Settings > Rules > Rulesets
2. Create a new ruleset (Branch Ruleset) to require a specific workflow (`governance-check.yml`)
  1. Set a name such as "Required Governance Workflow"
  2. For enforcement select `enabled`
  3. Under `target branches` select to include the default branch
  4. There are several branch rules you can configure.  These are all recommended for a secure and collaborative workflow:
     - Require pull requests before merging
     - Require approvals (avoid for this lab as you are the only user)
     - Dismiss stale pull request approvals when new commits are pushed
     - Automatically request Copilot code reviews
     - Block force pushes
  5. The `Require status checks to pass before merging` option allows you to select specific workflows that must complete successfully before a pull request can be merged.  Type `approval-gate` and select it.  Note this is the job name, not the workflow name.  Also note this workflow must have run at least once on the branch to appear in the list.
     - At the org level the same option is called `Require workflows to pass before merging`
  6. Click `Create` to save the ruleset.

Now create a branch, make any change to your repository (such as adding a new markdown file), and open a pull request to `main`.  You should see that the pull request cannot be merged because the required workflow has not completed successfully.

Once complete, go back into the ruleset and delete it so that it does not interfere with future labs.

## 3 — Additional Considerations

A few other things to consider for strong governance include:
- **Require signed commits**: Enforce GPG or SSH signing for all commits to verify authorship.  Documentation [here](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)
- **Limit workflow permissions**: Use `permissions:` in workflow files to restrict access to only what’s needed.  The base permissions in an organization can be set to `read` by default, which is a good practice.  Documentation [here](https://docs.github.com/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#setting-the-permissions-of-the-github_token-for-your-organization)


## Conclusion

Governance features in GitHub help you secure your automation, enforce compliance, and foster healthy collaboration. By implementing SLSA Level 3, generating SBOMs, requiring artifact attestations, and enforcing repository rulesets, you can build a robust, secure, and scalable CI/CD pipeline that meets the highest standards of software supply chain security.
