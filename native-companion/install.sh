#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
HOST_NAME="com.ai_usage_companion.host"

chmod +x "$DIR/ai_usage_host.sh"
chmod +x "$DIR/ai_usage_host.py"

TARGET_DIRS=(
  "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
  "$HOME/Library/Application Support/Chromium/NativeMessagingHosts"
  "$HOME/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts"
  "$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts"
  "$HOME/Library/Application Support/Arc/User Data/NativeMessagingHosts"
)

echo "Installing AI Usage Companion Native Host..."

for TARGET_DIR in "${TARGET_DIRS[@]}"; do
  mkdir -p "$TARGET_DIR"
  sed -e "s|\"/Users/surajjaiswal/Extensions/Ai Limit/native-companion/ai_usage_host.sh\"|\"$DIR/ai_usage_host.sh\"|g" "$DIR/com.ai_usage_companion.host.json" > "$TARGET_DIR/$HOST_NAME.json"
  echo "✔ Installed manifest to: $TARGET_DIR/$HOST_NAME.json"
done

# Initialize config and token
python3 -c "
import os, json, hashlib
config_dir = os.path.expanduser('~/.config/ai-usage-companion')
os.makedirs(config_dir, exist_ok=True)
config_path = os.path.join(config_dir, 'config.json')
token = 'a7caa4c989669456e4f54939055cf61b070e7fc8a03164cced7b62ab237b99e4'
if os.path.exists(config_path):
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            token = data.get('auth_token', token)
    except Exception:
        pass
with open(config_path, 'w', encoding='utf-8') as f:
    json.dump({'auth_token': token}, f, indent=2)
print(f'Active Companion Token: {token}')
"

echo "Setup complete! Ready to connect in extension settings."
