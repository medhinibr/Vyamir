# Contributing to Vyamir

Thank you for your interest in contributing to Vyamir. To maintain code quality, security, and deployment stability, please adhere to the following guidelines.

## 1. Development Workflow

1. Clone the repository and configure your local environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```
2. Create a feature branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Add tests for new features in `test_app.py`.

## 2. Commit Message Standard

All commit messages in the Vyamir repository must follow a strict **two-word technical standard** with no emojis. The message must consist of a lowercase action verb followed by a lowercase technical noun.

Examples:
* `setup iac`
* `remove start`
* `defer scripts`
* `optimize templates`
* `update readme`

## 3. Code Quality and Testing

Before staging and pushing your modifications, verify that your changes pass all local validation checks:

* **Linting**: Code must comply with PEP 8 layout rules. Verify this by running:
  ```bash
  flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
  ```
* **Testing**: All unit tests must pass. Run:
  ```bash
  python -m pytest
  ```

## 4. Submitting Pull Requests

* Ensure your branch is fully up-to-date with `origin/main` before opening a pull request.
* Verify that the GitHub Actions pipeline runs successfully and all checks are green.
