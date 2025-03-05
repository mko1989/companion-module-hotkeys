# Hotkeys Module for Companion

This module allows you to monitor keyboard key presses on your local machine and use them as triggers in Companion.

## Configuration

1. Add keys to monitor in the module configuration
2. Each key will create a variable that can be used in your buttons and actions
3. The variable value will be 1 when the key is pressed and 0 when released

## Variables

For each key you configure, a variable will be created with the name `$(hotkeys:[key_name])` where `[key_name]` is the name you gave to the key in the configuration.

## Troubleshooting

If keys are not being detected, ensure that:

1. Companion has permission to monitor keyboard input on your system
2. No security software is blocking keyboard monitoring
3. The application has focus (or is running with appropriate permissions)
