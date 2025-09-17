#!/bin/bash
cd /home/kavia/workspace/code-generation/wildlife-monitoring-and-tracking-system-21372-21382/wildlife_tracking_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

