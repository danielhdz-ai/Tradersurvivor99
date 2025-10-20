Run Bitget futures test (local)

This script attempts a Bitget futures (mix) request. It tries the local proxy first, then a direct call.

Usage:

1) Set environment variables (Windows cmd.exe):

   set BITGET_API_KEY=your_api_key
   set BITGET_SECRET=your_secret
   set BITGET_PASSPHRASE=your_passphrase

2) (Optional) If proxy runs on a different host/port:

   set PROXY_URL=http://127.0.0.1:8003

3) Run the test:

   node run-bitget-futures-test.js

The script prints full request/response details. Paste output here for analysis.
