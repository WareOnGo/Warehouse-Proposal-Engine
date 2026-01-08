# AWS ECR + App Runner Deployment Guide

## Prerequisites
- AWS Account
- GitHub repository for your code
- AWS CLI installed locally (optional, for manual setup)

## Step 1: Create ECR Repository

1. Go to AWS Console → ECR (Elastic Container Registry)
2. Click "Create repository"
3. Name it (e.g., `warehouse-ppt-service`)
4. Keep settings as default
5. Click "Create repository"
6. Note the repository URI (e.g., `123456789.dkr.ecr.us-east-1.amazonaws.com/warehouse-ppt-service`)

## Step 2: Create App Runner Service

1. Go to AWS Console → App Runner
2. Click "Create service"
3. Choose "Container registry" → "Amazon ECR"
4. Select your ECR repository
5. **Choose "Automatic" deployment trigger** (App Runner will auto-deploy on ECR push)
6. Create a new service role or use existing
7. Configure service:
   - Service name: `warehouse-ppt-service`
   - Port: `3001`
   - CPU: 1 vCPU
   - Memory: 2 GB
8. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `FRONTEND_URL`: Your frontend URL (if needed)
   - `PORT`: `3001`
9. Click "Create & deploy"

## Step 3: Set Up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_REGION`: Your AWS region (e.g., `us-east-1`)
- `ECR_REPOSITORY`: Your ECR repository name (e.g., `warehouse-ppt-service`)

### How to get AWS credentials:
1. Go to AWS Console → IAM
2. Create a new user or use existing
3. Attach policies:
   - `AmazonEC2ContainerRegistryPowerUser`
   - `AWSAppRunnerFullAccess`
4. Create access key → Save the credentials

## Step 4: Deploy

1. Push your code to the `main` branch:
```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

2. GitHub Actions will automatically:
   - Build your Docker image
   - Push it to ECR
   - App Runner detects the new image and auto-deploys

3. Monitor the deployment:
   - GitHub: Actions tab
   - AWS: App Runner console

## Step 5: Access Your Application

Once deployed, App Runner provides a URL like:
`https://xxxxx.us-east-1.awsapprunner.com`

Test your endpoints:
```bash
curl https://your-app-runner-url.awsapprunner.com/api/warehouses
```

## Local Testing

Test the Docker image locally before deploying:

```bash
# Build the image
docker build -t warehouse-ppt-service .

# Run the container
docker run -p 3001:3001 \
  -e DATABASE_URL="your-database-url" \
  warehouse-ppt-service

# Test
curl http://localhost:3001/api/warehouses
```

## Troubleshooting

### Build fails
- Check Dockerfile syntax
- Ensure all dependencies are in package.json
- Check GitHub Actions logs

### Deployment fails
- Verify AWS credentials in GitHub secrets
- Check IAM permissions
- Verify ECR repository exists
- Check App Runner service ARN is correct

### App crashes
- Check App Runner logs in AWS Console
- Verify environment variables are set
- Check database connectivity
- Ensure PORT is set to 3001

### Database connection issues
- Verify DATABASE_URL is correct
- Check if database allows connections from App Runner IP
- For Supabase: Enable connection pooling

## Cost Optimization

App Runner pricing:
- Pay for compute time (vCPU + memory)
- Pay for requests
- Free tier: 2000 build minutes/month

To reduce costs:
- Use smaller instance sizes if possible
- Set up auto-scaling based on traffic
- Use manual deployment trigger (already configured)

## Updating the Application

Simply push to main branch:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

GitHub Actions will handle the rest!
