# API Configuration Guide

## Switching Between Local and Production API

The app can now connect to either your local development server or the production server on Render.

### Configuration File: `frontend/.env`

```env
# API Configuration
# Set to 'local' or 'production'
API_MODE=local

# Local API URL
LOCAL_API_URL=http://192.168.1.6:3000

# Production API URL
PRODUCTION_API_URL=https://unreliable-journal.onrender.com
```

## How to Switch API Modes

### Use Local API (Development)

1. Open `frontend/.env`
2. Set `API_MODE=local`
3. Update `LOCAL_API_URL` to your machine's IP address if needed
4. **Stop and restart Metro bundler** (important!)
   ```bash
   # Press Ctrl+C to stop, then:
   npm start
   ```

### Use Production API (Render)

1. Open `frontend/.env`
2. Set `API_MODE=production`
3. **Stop and restart Metro bundler** (important!)
   ```bash
   # Press Ctrl+C to stop, then:
   npm start
   ```

## Finding Your Local IP Address

### Windows
```bash
ipconfig
```
Look for "IPv4 Address" (usually starts with 192.168.x.x)

### Mac/Linux
```bash
ifconfig
```
Look for "inet" under your network interface (usually starts with 192.168.x.x)

## Special Cases

### Android Emulator (Local API)
```env
LOCAL_API_URL=http://10.0.2.2:3000
```

### iOS Simulator (Local API)
```env
LOCAL_API_URL=http://localhost:3000
```

### Physical Device (Local API)
Use your computer's IP address (e.g., `http://192.168.1.6:3000`)
Make sure your phone and computer are on the same WiFi network!

## Debugging

When the app starts, you'll see console logs showing which API it's using:

```
🌐 API Mode: local
🔗 API Base URL: http://192.168.1.6:3000
```

or

```
🌐 API Mode: production
🔗 API Base URL: https://unreliable-journal.onrender.com
```

## Important Notes

1. **Always restart Metro bundler** after changing `.env` variables
2. Environment variables are loaded at build time, not runtime
3. The `.env` file is gitignored for security
4. Each team member should configure their own `LOCAL_API_URL`

## Examples

### Developer using local backend
```env
API_MODE=local
LOCAL_API_URL=http://192.168.1.100:3000
PRODUCTION_API_URL=https://unreliable-journal.onrender.com
```

### Testing production before deployment
```env
API_MODE=production
LOCAL_API_URL=http://192.168.1.100:3000
PRODUCTION_API_URL=https://unreliable-journal.onrender.com
```

### Demo/presentation mode (always use production)
```env
API_MODE=production
LOCAL_API_URL=http://192.168.1.100:3000
PRODUCTION_API_URL=https://unreliable-journal.onrender.com
```
