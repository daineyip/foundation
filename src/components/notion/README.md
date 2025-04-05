# Notion Integration Components

## Architecture

The Notion integration in Foundation has the following components:

```
┌──────────────┐      ┌───────────────┐      ┌────────────────┐
│              │      │               │      │                │
│    Notion    │─────►│  Foundation   │─────►│    Generated   │
│  Workspace   │◄─────┤     API       │─────►│      Code      │
│              │      │               │      │                │
└──────────────┘      └───────────────┘      └────────────────┘
```

## Components

1. **Notion API Client** (`/src/lib/api/notion.ts`)
   - Core functions for interacting with the Notion API
   - Methods for fetching workspaces, pages, and page content
   - OAuth helper functions

2. **OAuth Flow** 
   - Connection setup in `/src/app/dashboard/notion/page.tsx`
   - OAuth callback handler in `/src/app/api/notion/callback/route.ts`
   - Secure cookie management for storing access tokens

3. **API Routes**
   - `/api/notion/pages` - Get all pages from connected workspace
   - `/api/notion/callback` - Handle OAuth redirect and token exchange

4. **UI Components**
   - Notion connection page
   - Page selection interface
   - Error handling and loading states

## Integration Workflow

1. User clicks "Connect to Notion" which redirects to Notion OAuth page
2. User authorizes the integration in Notion
3. Notion redirects back to our callback URL with an authorization code
4. Backend exchanges code for access token and stores it in cookies
5. User is redirected to the Notion integration page
6. Page loads available Notion pages using the stored access token
7. User selects pages to use for generating their prototype
8. Selected pages are sent to the AI service for code generation

## Security Considerations

- Access tokens are stored in HttpOnly cookies for security
- API routes validate the presence of tokens before making requests
- Error handling for various OAuth and API failure scenarios

## Extending the Integration

To add new Notion API features:

1. Add new methods to the Notion client in `/src/lib/api/notion.ts`
2. Create new API routes in `/src/app/api/notion/` as needed
3. Update UI components to utilize the new functionality

For detailed setup instructions, refer to the `NOTION_SETUP.md` file in the project root. 