# Setting Up Notion Integration

This document provides step-by-step instructions for setting up the Notion integration for Foundation.

## 1. Create a Notion Integration

1. Go to [Notion's developers page](https://www.notion.so/my-integrations)
2. Click on "Create new integration"
3. Fill in the following details:
   - **Name**: Foundation
   - **Logo**: (Optional) Upload a logo for your integration
   - **Associated workspace**: Select the workspace you want to use with Foundation
   - **Capabilities**: Select "Read content", "Update content", and "Insert content" (as needed)
4. Click "Submit" to create your integration

## 2. Get Your Internal Integration Token

After creating your integration, you'll see your **Internal Integration Token**. This is what you'll use to connect Foundation with your Notion workspace.

1. Copy the Internal Integration Token (click "Show" to reveal it)
2. In your Foundation application, paste this token when prompted to connect to Notion

## 3. Configure Environment Variables (for development)

If you're developing with Foundation locally:

1. Create a `.env.local` file in the root of the project (if not already created)
2. Add the following variable with your Notion integration token:

```
NOTION_API_KEY=your_internal_integration_token
```

## 4. Add Integration to Your Workspace Pages

For each page you want to use in Foundation:

1. Open the Notion page
2. Click on the "•••" menu in the top right corner
3. Select "Add connections"
4. Find and select your "Foundation" integration
5. Click "Confirm"

This grants the integration access to read and modify the content of the specific page.

## 5. Testing the Integration

1. Start the development server: `npm run dev`
2. Go to `http://localhost:3000/dashboard/notion`
3. Paste your Internal Integration Token when prompted
4. Click "Connect to Notion"
5. Your Notion pages should be listed for selection

## Troubleshooting

- **Access issues**: Make sure you've added the integration to the pages you want to access
- **API key errors**: Verify your Internal Integration Token is correct 
- **Failed to fetch pages**: Check if your integration has the necessary capabilities

## API Documentation

For more details, refer to the [Notion API documentation](https://developers.notion.com/). 