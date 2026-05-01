#!/bin/bash

# On the VPS, run this script to setup GitHub access for cloning

echo "Generating SSH key for GitHub access..."
ssh-keygen -t ed25519 -f ~/.ssh/github -N '""' -C "vps-$(hostname)"

echo ""
echo "========================================"
echo "COPY THIS PUBLIC KEY TO GITHUB:"
echo "========================================"
cat ~/.ssh/github.pub
echo ""
echo "========================================"
echo "Go to: https://github.com/weareuntitled/peters-erp/settings/keys"
echo "Click 'Add deploy key', paste the key above, enable 'Allow write access'"
echo ""
echo "After adding, run:"
echo "  ./continue-setup.sh"
echo "========================================"

# Setup SSH config for GitHub
cat > ~/.ssh/config << 'EOF'
Host github.com
    IdentityFile ~/.ssh/github
    StrictHostKeyChecking no
EOF

chmod 600 ~/.ssh/config
