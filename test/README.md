# Revelry Engine Testing

This project uses a dual testing strategy to ensure code works correctly in both browser and Deno environments.

## Running Tests

### Run All Tests
```bash
deno task test
```

### Run Tests for Specific Package
```bash
deno task test --pkg=utils
deno task test --pkg=ecs
deno task test --pkg=gltf
```

### Run Tests in Specific Environment
```bash
deno task test --env=browser  # Browser only (Chromium + Firefox)
deno task test --env=deno     # Deno only
```

### Combine Package and Environment Filters
```bash
deno task test --pkg=utils --env=browser
```

## Coverage Reports

### Generate Combined Coverage Report
```bash
deno task test --coverage
```

This will:
1. Run all tests in both browser and Deno environments
2. Generate LCOV reports for each environment in `coverage/browser/` and `coverage/deno/`
3. Merge the LCOV reports into a combined report at `coverage/lcov.info`
4. Generate an HTML coverage report in `coverage/html/`

**View the coverage report:**
- Open `coverage/html/index.html` in your browser
- Or check the combined LCOV file at `coverage/lcov.info`


## Test Frameworks
- **Browser Tests:** Uses `@web/test-runner` with Mocha/Chai and Playwright (Chromium + Firefox)
- **Deno Tests:** Uses built-in Deno test framework with BDD helpers from `test/bdd.js`

## Test Locations
All tests are located in `__tests__/` directories within each package:
```
packages/
  utils/__tests__/
  ecs/__tests__/
  gltf/__tests__/
```

## Debug Mode

### Debug Browser Tests
```bash
deno task test --debug
```
Opens the test runner UI in your browser and keeps it open for manual inspection.

### Debug Deno Tests
```bash
deno task test --env=deno --debug
```
Runs Deno tests with `--inspect` and `--inspect-wait` flags for debugger attachment.
