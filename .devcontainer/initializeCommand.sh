#!/bin/bash

echo "Running custom container initilizeCommand commands..."
echo
chmod +x scripts/setup_node_packaging.sh

# Run the commands
scripts/setup_node_packaging.sh

echo "✅ Done running custom container initilizeCommand commands."
echo