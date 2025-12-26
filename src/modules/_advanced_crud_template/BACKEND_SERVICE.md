# Backend Service Guide for Developers

## 🎯 For View Developers

**You don't need to worry about the backend!** 

The backend service is already set up and working. You can focus 100% on frontend development.

### What You Get

✅ **Data automatically fetched** - The main route component handles all API calls  
✅ **Data passed via props** - Your view receives `records` prop with all data  
✅ **CRUD operations handled** - Edit/delete callbacks are provided  
✅ **No API knowledge needed** - Just focus on UI/UX  

### How It Works

1. The main route (`routes/index.tsx`) uses the backend service
2. The service fetches data from the external API
3. Data is passed to your view component via props
4. You just render the data - no API calls needed!

### Your View Props

```typescript
interface ViewProps {
  records: AdvancedCrudRecord[];  // ✅ Data from backend
  loading?: boolean;               // ✅ Loading state
  onEdit?: (record) => void;       // ✅ Edit callback (handled by route)
  onDelete?: (record) => void;    // ✅ Delete callback (handled by route)
  showActions?: boolean;           // ✅ Whether to show actions
}
```

## 🔧 For Backend/Service Developers

### Service Location

- **Service**: `services/advancedCrudService.ts`
- **Config**: `config/api.config.ts`

### Current Backend

- **URL**: `https://linkedin-automation-supabase.ibrcloud.com/rest/v1/tasks`
- **Method**: Supabase REST API
- **Auth**: API Key + Bearer Token

### Updating Backend URL

1. Open `config/api.config.ts`
2. Update `baseUrl` and `endpoint`
3. Update `apiKey` if needed
4. That's it! No other changes needed.

### API Response Format

The service expects the API to return an array of records. The service automatically maps the response to our internal format.

If the API response structure changes, update the `mapApiRecordToRecord` function in `services/advancedCrudService.ts`.

### Testing the Service

You can test the service directly:

```typescript
import { fetchRecords } from '../services/advancedCrudService';

const result = await fetchRecords({ search: 'test' });
console.log(result.data); // Array of records
```

## 📋 API Endpoints Used

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List | GET | `/tasks?select=*` |
| Get by ID | GET | `/tasks?id=eq.{id}` |
| Create | POST | `/tasks` |
| Update | PATCH | `/tasks?id=eq.{id}` |
| Delete | DELETE | `/tasks?id=eq.{id}` |

## 🔐 Authentication

The service uses:
- `apikey` header
- `Authorization: Bearer {token}` header

Both are configured in `config/api.config.ts`.

## 🚨 Important Notes

1. **View developers**: Don't modify the service - it's shared
2. **Service developers**: Update config file, not the route
3. **All views**: Use the same backend service automatically
4. **No conflicts**: Service is isolated from view code

---

**Remember**: View developers focus on frontend, service handles backend! 🚀

