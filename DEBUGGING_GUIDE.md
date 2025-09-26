# Mock Interview API Debugging Guide

## Issue: 500 Internal Server Error on Answer Submission

### Quick Fix Applied

I've implemented several fixes to resolve the 500 Internal Server Error:

1. **Enhanced Error Handling**: Added comprehensive try-catch blocks with detailed logging
2. **AI API Fallback**: Added fallback evaluation when AI API fails
3. **Input Validation**: Added strict validation for all input parameters
4. **Database Error Handling**: Improved database operation error handling
5. **Debug Endpoints**: Created test endpoints for troubleshooting

### Files Modified

1. **`app/api/mockinterview/[sessionId]/route.ts`** - Main submit answer endpoint with fixes
2. **`app/api/mockinterview/[sessionId]/simple/route.ts`** - Simplified version for testing
3. **`app/api/mockinterview/[sessionId]/test/route.ts`** - Debug endpoint
4. **`app/api/health/route.ts`** - Health check endpoint

### Testing Steps

1. **Health Check**
   ```bash
   # Test basic API functionality
   GET http://localhost:3000/api/health
   ```

2. **Session Validation**
   ```bash
   # Replace {sessionId} with actual session ID
   GET http://localhost:3000/api/mockinterview/{sessionId}/test
   ```

3. **Simplified Submit**
   ```bash
   # Test with simplified endpoint first
   POST http://localhost:3000/api/mockinterview/{sessionId}/simple
   Content-Type: application/json
   
   {
     "questionId": "q_1_123456789",
     "answer": "This is a test answer",
     "timeSpent": 60
   }
   ```

4. **Full Submit**
   ```bash
   # Test with full endpoint
   POST http://localhost:3000/api/mockinterview/{sessionId}
   Content-Type: application/json
   
   {
     "questionId": "q_1_123456789", 
     "answer": "This is a test answer",
     "timeSpent": 60
   }
   ```

### Environment Check

Make sure these environment variables are set:
```env
MONGODB_URL=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key (optional - will use fallback if missing)
CLERK_SECRET_KEY=your_clerk_secret_key
```

### Common Issues Fixed

1. **AI API Failures**: Now uses fallback evaluation
2. **Database Connection Issues**: Better error handling
3. **Session Not Found**: Improved session lookup logic
4. **Invalid JSON**: Better request parsing
5. **Missing Fields**: Clear validation messages

### Monitoring

Check the server console for detailed logs:
- `✓` indicates successful steps
- `!` indicates warnings but continuing
- `✗` indicates errors that cause failure

### Next Steps

1. Test the health endpoint first
2. If health check passes, test session validation
3. Try the simplified submit endpoint
4. If simplified works, try the full endpoint
5. Check console logs for specific error details

The API should now be much more robust and provide clear error messages instead of generic 500 errors.