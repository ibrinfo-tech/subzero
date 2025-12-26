# Backend Service Documentation

## Overview

This service handles all backend API communication for the Advanced CRUD module. **View developers should NOT modify this service** - they should focus on frontend development only.

## Service Location

- **File**: `services/advancedCrudService.ts`
- **Config**: `config/api.config.ts`

## API Configuration

The API configuration is located in `config/api.config.ts`. Update this file when:
- The backend URL changes
- API credentials need to be updated
- API endpoint path changes

### Current Configuration

```typescript
{
  baseUrl: 'https://linkedin-automation-supabase.ibrcloud.com/rest/v1',
  endpoint: '/tasks',
  apiKey: '...',
}
```

## Available Functions

### `fetchRecords(options?)`

Fetches all records from the backend API.

**Parameters:**
- `options.search?: string` - Search term
- `options.status?: string` - Filter by status
- `options.limit?: number` - Limit results
- `options.offset?: number` - Pagination offset

**Returns:**
```typescript
{
  data: AdvancedCrudRecord[];
  success: boolean;
  error?: string;
}
```

### `fetchRecordById(id)`

Fetches a single record by ID.

**Parameters:**
- `id: string` - Record ID

**Returns:**
```typescript
{
  data: AdvancedCrudRecord[];
  success: boolean;
  error?: string;
}
```

### `createRecord(input)`

Creates a new record.

**Parameters:**
- `input: CreateAdvancedCrudInput` - Record data

**Returns:**
```typescript
{
  data: AdvancedCrudRecord[];
  success: boolean;
  error?: string;
}
```

### `updateRecord(id, input)`

Updates an existing record.

**Parameters:**
- `id: string` - Record ID
- `input: UpdateAdvancedCrudInput` - Updated data

**Returns:**
```typescript
{
  data: AdvancedCrudRecord[];
  success: boolean;
  error?: string;
}
```

### `deleteRecord(id)`

Deletes a record.

**Parameters:**
- `id: string` - Record ID

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

## Usage in Views

View developers **do NOT need to use this service directly**. The main route component (`routes/index.tsx`) handles all API calls and passes data to views via props.

## Data Mapping

The service automatically maps API responses to our internal `AdvancedCrudRecord` format. If the API response structure changes, update the `mapApiRecordToRecord` function in the service.

## Error Handling

All service functions return a response object with:
- `success: boolean` - Whether the operation succeeded
- `data?: AdvancedCrudRecord[]` - The data (if successful)
- `error?: string` - Error message (if failed)

The main route component handles displaying errors to users via toast notifications.

## Updating the Backend URL

When the backend URL changes:

1. Open `config/api.config.ts`
2. Update the `baseUrl` property
3. Update the `endpoint` property if needed
4. Update `apiKey` if credentials change

No other files need to be modified.

---

**Note**: This service is shared across all views. View developers should focus on frontend UI/UX only.

