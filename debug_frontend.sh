#!/bin/sh
grep -o 'localhost:8000[^"]*' /usr/share/nginx/html/assets/index-*.js | sort -u | head -10
