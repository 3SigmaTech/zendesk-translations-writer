#!/usr/bin/env bash

YOUR_FILE='package.json'
FINDTEXT="\\\"name\\\": \\\"zendesk-translations-writer\\\""
SUBSTEXT="\\\"name\\\": \\\"@3SigmaTech\/zendesk-translations-writer\\\""

if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i "" "s/$FINDTEXT/$SUBSTEXT/g" $YOUR_FILE
else
  sed -i "s/$FINDTEXT/$SUBSTEXT/g" $YOUR_FILE
fi