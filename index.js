const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const KeyListener = require('./keylistener')
const UpgradeScripts = require('./upgrades')

class HotkeysInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.keyListener = null
		this.monitoredKeys = []
		this.keyStates = {}
	}

	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Ok)

		// Initialize monitored keys array based on config
		this.monitoredKeys = []

		// Add key 1 (always monitored)
		this.monitoredKeys.push({
			id: 'key1',
			value: this.config.key1_id || 'Space',
		})

		// Add key 2 if enabled
		if (this.config.key2_enabled === true) {
			this.monitoredKeys.push({
				id: 'key2',
				value: this.config.key2_id || 'Enter',
			})
		}

		// Add key 3 if enabled
		if (this.config.key3_enabled === true) {
			this.monitoredKeys.push({
				id: 'key3',
				value: this.config.key3_id || 'Escape',
			})
		}

		// Add key 4 if enabled
		if (this.config.key4_enabled === true) {
			this.monitoredKeys.push({
				id: 'key4',
				value: this.config.key4_id || 'PageUp',
			})
		}

		// Add key 5 if enabled
		if (this.config.key5_enabled === true) {
			this.monitoredKeys.push({
				id: 'key5',
				value: this.config.key5_id || 'PageDown',
			})
		}

		// Add key 6 if enabled
		if (this.config.key6_enabled === true) {
			this.monitoredKeys.push({
				id: 'key6',
				value: this.config.key6_id || 'F1',
			})
		}

		// Log monitored keys
		this.log('info', `Configured keys: ${JSON.stringify(this.monitoredKeys)}`)

		// Initialize variables first, before starting the listener
		this.updateVariableDefinitions()

		// Initialize keylistener
		try {
			this.keyListener = new KeyListener(this)
			this.keyListener.startListening()
			this.log('info', 'Key listener started successfully')
		} catch (error) {
			this.log('error', `Failed to start key listener: ${error.message}`)
			this.updateStatus(InstanceStatus.Error, error.message)
		}

		// Set initial states for all monitored keys
		const initialValues = {}
		for (const keyConfig of this.monitoredKeys) {
			initialValues[keyConfig.id] = 0
			this.keyStates[keyConfig.id] = 0
		}
		this.log('debug', `Setting initial variable values: ${JSON.stringify(initialValues)}`)
		this.setVariableValues(initialValues)
	}

	// Called when config is updated
	async configUpdated(config) {
		const prevConfig = this.config
		this.config = config

		// Check if key configuration has changed
		const keysChanged =
			prevConfig.key1_id !== config.key1_id ||
			prevConfig.key2_id !== config.key2_id ||
			prevConfig.key3_id !== config.key3_id ||
			prevConfig.key4_id !== config.key4_id ||
			prevConfig.key5_id !== config.key5_id ||
			prevConfig.key6_id !== config.key6_id ||
			prevConfig.key2_enabled !== config.key2_enabled ||
			prevConfig.key3_enabled !== config.key3_enabled ||
			prevConfig.key4_enabled !== config.key4_enabled ||
			prevConfig.key5_enabled !== config.key5_enabled ||
			prevConfig.key6_enabled !== config.key6_enabled

		if (keysChanged) {
			// Stop current listener
			if (this.keyListener) {
				this.keyListener.stopListening()
			}

			// Update monitored keys
			this.monitoredKeys = []

			// Add key 1 (always monitored)
			this.monitoredKeys.push({
				id: 'key1',
				value: config.key1_id || 'Space',
			})

			// Add key 2 if enabled
			if (config.key2_enabled === true) {
				this.monitoredKeys.push({
					id: 'key2',
					value: config.key2_id || 'Enter',
				})
			}

			// Add key 3 if enabled
			if (config.key3_enabled === true) {
				this.monitoredKeys.push({
					id: 'key3',
					value: config.key3_id || 'Escape',
				})
			}

			// Add key 4 if enabled
			if (config.key4_enabled === true) {
				this.monitoredKeys.push({
					id: 'key4',
					value: config.key4_id || 'PageUp',
				})
			}

			// Add key 5 if enabled
			if (config.key5_enabled === true) {
				this.monitoredKeys.push({
					id: 'key5',
					value: config.key5_id || 'PageDown',
				})
			}

			// Add key 6 if enabled
			if (config.key6_enabled === true) {
				this.monitoredKeys.push({
					id: 'key6',
					value: config.key6_id || 'F1',
				})
			}

			// Log monitored keys
			this.log('info', `Configured keys: ${JSON.stringify(this.monitoredKeys)}`)

			// Update variable definitions
			this.updateVariableDefinitions()

			// Restart listener with new config
			try {
				this.keyListener = new KeyListener(this)
				this.keyListener.startListening()
				this.log('info', 'Key listener restarted successfully')
			} catch (error) {
				this.log('error', `Failed to restart key listener: ${error.message}`)
				this.updateStatus(InstanceStatus.Error, error.message)
			}

			// Reset all key states
			const resetValues = {}
			for (const keyConfig of this.monitoredKeys) {
				resetValues[keyConfig.id] = 0
				this.keyStates[keyConfig.id] = 0
			}
			this.log('debug', `Setting reset variable values: ${JSON.stringify(resetValues)}`)
			this.setVariableValues(resetValues)
		}
	}

	// Called when the module is disabled/removed
	async destroy() {
		if (this.keyListener) {
			this.keyListener.stopListening()
			this.keyListener = null
		}
		this.log('debug', 'Module destroyed')
	}

	// Handle key press/release events
	handleKeyEvent(variableId, state) {
		// Update variable value with minimal latency
		this.setVariableValues({ [variableId]: state })
		this.keyStates[variableId] = state
		this.log('debug', `Variable ${variableId} set to ${state}`)
	}

	// Update variable definitions based on configured keys
	updateVariableDefinitions() {
		this.log('debug', 'Updating variable definitions')

		// Map key configs to variable definitions
		const variables = this.monitoredKeys.map((keyConfig) => {
			this.log('debug', `Creating variable for key: ID=${keyConfig.id}, Value=${keyConfig.value}`)
			return {
				name: `${keyConfig.value}`,
				variableId: keyConfig.id,
			}
		})

		this.log('info', `Setting ${variables.length} variable definitions`)

		// Set the variable definitions in Companion
		this.setVariableDefinitions(variables)

		// Initialize variable values to 0
		const variableValues = this.monitoredKeys.reduce((obj, keyConfig) => {
			obj[keyConfig.id] = 0
			return obj
		}, {})

		this.log('debug', `Initializing variable values: ${JSON.stringify(variableValues)}`)
		this.setVariableValues(variableValues)
	}

	// Return config fields for web config
	getConfigFields() {
		const keyOptions = [
			{ id: 'Backspace', label: 'Backspace' },
			{ id: 'Tab', label: 'Tab' },
			{ id: 'Enter', label: 'Enter' },
			{ id: 'Shift', label: 'Shift' },
			{ id: 'LEFT Shift', label: 'Left Shift' },
			{ id: 'RIGHT Shift', label: 'Right Shift' },
			{ id: 'Control', label: 'Control' },
			{ id: 'LEFT Control', label: 'Left Control' },
			{ id: 'RIGHT Control', label: 'Right Control' },
			{ id: 'Alt', label: 'Alt' },
			{ id: 'LEFT Alt', label: 'Left Alt' },
			{ id: 'RIGHT Alt', label: 'Right Alt' },
			{ id: 'Pause', label: 'Pause' },
			{ id: 'CapsLock', label: 'Caps Lock' },
			{ id: 'Escape', label: 'Escape' },
			{ id: 'Space', label: 'Space' },
			{ id: 'PageUp', label: 'Page Up' },
			{ id: 'PageDown', label: 'Page Down' },
			{ id: 'End', label: 'End' },
			{ id: 'Home', label: 'Home' },
			{ id: 'ArrowLeft', label: 'Left Arrow' },
			{ id: 'ArrowUp', label: 'Up Arrow' },
			{ id: 'ArrowRight', label: 'Right Arrow' },
			{ id: 'ArrowDown', label: 'Down Arrow' },
			{ id: 'PrintScreen', label: 'Print Screen' },
			{ id: 'Insert', label: 'Insert' },
			{ id: 'Delete', label: 'Delete' },
			{ id: '0', label: '0' },
			{ id: '1', label: '1' },
			{ id: '2', label: '2' },
			{ id: '3', label: '3' },
			{ id: '4', label: '4' },
			{ id: '5', label: '5' },
			{ id: '6', label: '6' },
			{ id: '7', label: '7' },
			{ id: '8', label: '8' },
			{ id: '9', label: '9' },
			{ id: 'Numpad0', label: 'Numpad 0' },
			{ id: 'Numpad1', label: 'Numpad 1' },
			{ id: 'Numpad2', label: 'Numpad 2' },
			{ id: 'Numpad3', label: 'Numpad 3' },
			{ id: 'Numpad4', label: 'Numpad 4' },
			{ id: 'Numpad5', label: 'Numpad 5' },
			{ id: 'Numpad6', label: 'Numpad 6' },
			{ id: 'Numpad7', label: 'Numpad 7' },
			{ id: 'Numpad8', label: 'Numpad 8' },
			{ id: 'Numpad9', label: 'Numpad 9' },
			{ id: 'NumpadMultiply', label: 'Numpad *' },
			{ id: 'NumpadAdd', label: 'Numpad +' },
			{ id: 'NumpadSubtract', label: 'Numpad -' },
			{ id: 'NumpadDecimal', label: 'Numpad .' },
			{ id: 'NumpadDivide', label: 'Numpad /' },
			{ id: 'NumpadEnter', label: 'Numpad Enter' },
			{ id: 'F1', label: 'F1' },
			{ id: 'F2', label: 'F2' },
			{ id: 'F3', label: 'F3' },
			{ id: 'F4', label: 'F4' },
			{ id: 'F5', label: 'F5' },
			{ id: 'F6', label: 'F6' },
			{ id: 'F7', label: 'F7' },
			{ id: 'F8', label: 'F8' },
			{ id: 'F9', label: 'F9' },
			{ id: 'F10', label: 'F10' },
			{ id: 'F11', label: 'F11' },
			{ id: 'F12', label: 'F12' },
			{ id: 'NumLock', label: 'Num Lock' },
			{ id: 'ScrollLock', label: 'Scroll Lock' },
			{ id: 'Meta', label: 'Windows/Meta' },
			{ id: 'A', label: 'A' },
			{ id: 'B', label: 'B' },
			{ id: 'C', label: 'C' },
			{ id: 'D', label: 'D' },
			{ id: 'E', label: 'E' },
			{ id: 'F', label: 'F' },
			{ id: 'G', label: 'G' },
			{ id: 'H', label: 'H' },
			{ id: 'I', label: 'I' },
			{ id: 'J', label: 'J' },
			{ id: 'K', label: 'K' },
			{ id: 'L', label: 'L' },
			{ id: 'M', label: 'M' },
			{ id: 'N', label: 'N' },
			{ id: 'O', label: 'O' },
			{ id: 'P', label: 'P' },
			{ id: 'Q', label: 'Q' },
			{ id: 'R', label: 'R' },
			{ id: 'S', label: 'S' },
			{ id: 'T', label: 'T' },
			{ id: 'U', label: 'U' },
			{ id: 'V', label: 'V' },
			{ id: 'W', label: 'W' },
			{ id: 'X', label: 'X' },
			{ id: 'Y', label: 'Y' },
			{ id: 'Z', label: 'Z' },
		]

		return [
			{
				type: 'static-text',
				id: 'info',
				label: 'Info',
				value:
					'This module allows you to monitor up to 6 keyboard keys and use them as variables in your Companion instance.',
				width: 12,
			},
			// Key 1 - Always enabled by default
			{
				type: 'dropdown',
				id: 'key1_id',
				label: 'Key 1',
				default: 'Space',
				width: 12,
				choices: keyOptions,
			},
			// Key 2
			{
				type: 'checkbox',
				id: 'key2_enabled',
				label: 'Monitor Key 2',
				default: false,
				width: 12,
			},
			{
				type: 'dropdown',
				id: 'key2_id',
				label: 'Key 2',
				default: 'Control',
				width: 12,
				choices: keyOptions,
				isVisible: (options) => !!options.key2_enabled,
			},
			// Key 3
			{
				type: 'checkbox',
				id: 'key3_enabled',
				label: 'Monitor Key 3',
				default: false,
				width: 12,
			},
			{
				type: 'dropdown',
				id: 'key3_id',
				label: 'Key 3',
				default: 'Alt',
				width: 12,
				choices: keyOptions,
				isVisible: (options) => !!options.key3_enabled,
			},
			// Key 4
			{
				type: 'checkbox',
				id: 'key4_enabled',
				label: 'Monitor Key 4',
				default: false,
				width: 12,
			},
			{
				type: 'dropdown',
				id: 'key4_id',
				label: 'Key 4',
				default: 'Escape',
				width: 12,
				choices: keyOptions,
				isVisible: (options) => !!options.key4_enabled,
			},
			// Key 5
			{
				type: 'checkbox',
				id: 'key5_enabled',
				label: 'Monitor Key 5',
				default: false,
				width: 12,
			},
			{
				type: 'dropdown',
				id: 'key5_id',
				label: 'Key 5',
				default: 'PageUp',
				width: 12,
				choices: keyOptions,
				isVisible: (options) => !!options.key5_enabled,
			},
			// Key 6
			{
				type: 'checkbox',
				id: 'key6_enabled',
				label: 'Monitor Key 6',
				default: false,
				width: 12,
			},
			{
				type: 'dropdown',
				id: 'key6_id',
				label: 'Key 6',
				default: 'PageDown',
				width: 12,
				choices: keyOptions,
				isVisible: (options) => !!options.key6_enabled,
			},
		]
	}
}

runEntrypoint(HotkeysInstance, UpgradeScripts)
