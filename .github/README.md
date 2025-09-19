# CI/CD Setup Instructions

## GitHub Secrets Required

To use the CI/CD pipeline, you need to add the following secrets to your GitHub repository:

### Repository Settings > Secrets and variables > Actions

1. **AWS_ACCESS_KEY_ID** - Your AWS access key ID for deployment
2. **AWS_SECRET_ACCESS_KEY** - Your AWS secret access key for deployment

### How to add secrets:

1. Go to your repository on GitHub
2. Click on "Settings" tab
3. In the left sidebar, click "Secrets and variables" > "Actions"
4. Click "New repository secret"
5. Add each secret with the exact name above

## Deployment Environments

- **Development**: Deployed when pushing to `develop` branch
- **Production**: Deployed when pushing to `main` branch

## AWS Region

The default region is set to `us-east-1`. If you need to use a different region, update the `aws-region` value in `.github/workflows/ci-cd.yml`.

## Troubleshooting

### Common Issues:

1. **Secret not found**: Make sure the secret names match exactly (case-sensitive)
2. **AWS permissions**: Ensure your AWS credentials have the necessary permissions for Serverless deployments
3. **Build failures**: Check the Actions tab for detailed error logs

### Testing Locally:

Before pushing to GitHub, test your build locally:

```bash
# Install all dependencies
npm run install:all

# Build all modules
npm run build

# Run tests
npm run test

# Run linting
npm run lint
```