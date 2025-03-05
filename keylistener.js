const { GlobalKeyboardListener } = require('node-global-key-listener')

class KeyListener {
	constructor(instance) {
		this.instance = instance
		this.keyboard = null
		this.pressedKeys = {}
	}

	startListening() {
		try {
			// Create a new instance of the global keyboard listener
			this.keyboard = new GlobalKeyboardListener()
			this.instance.log('debug', 'GlobalKeyboardListener created')

			// Log detected keys for configuration debugging
			this.instance.log('info', 'Monitored keys config:')
			this.instance.monitoredKeys.forEach(key => {
				this.instance.log('info', `Key ID: ${key.id}, Value: ${key.value}, Label: ${key.label || 'N/A'}`)
			})

			// Register the listener for both key down and key up events
			this.keyboard.addListener((e, isDown) => {
				// Get the original key name from the event
				const originalKeyName = e.name
				
				// Normalize the key name for consistent matching
				const keyName = this.normalizeKeyName(originalKeyName)
				
				const state = e.state === 'DOWN' ? 'down' : 'up'
				this.instance.log('debug', `Key event received: ${originalKeyName} (normalized: ${keyName}), state: ${state}`)

				// Find the key configuration
				const keyConfig = this.findKeyConfig(keyName)
				
				if (keyConfig) {
					const keyId = keyConfig.id
					const currentState = (state === 'down') ? 1 : 0

					this.instance.log('debug', `Found matching key config: ${JSON.stringify(keyConfig)}`)
					
					// Update the variable and keep track of our state
					this.pressedKeys[keyId] = currentState === 1
					this.instance.handleKeyEvent(keyId, currentState)
					this.instance.log('info', `Key ${keyName} (${keyId}) state changed to ${currentState}`)
				} else {
					this.instance.log('debug', `No key config found for: ${keyName}. Available configs: ${JSON.stringify(this.instance.monitoredKeys.map(k => k.value))}`)
				}
			})

			this.instance.log('info', 'Key listener started successfully')
			
			// List active monitored keys
			const keyNames = this.instance.monitoredKeys.map(k => `${k.id}:${k.value}`).join(', ')
			this.instance.log('info', `Monitoring keys: ${keyNames}`)
		} catch (error) {
			this.instance.log('error', `Failed to initialize key listener: ${error.message}`)
			throw error
		}
	}

	stopListening() {
		if (this.keyboard) {
			try {
				// Remove all listeners and clean up
				this.instance.log('debug', 'Stopping key listener')
				this.keyboard.removeListener()
				this.keyboard = null
				this.pressedKeys = {}
				this.instance.log('info', 'Key listener stopped')
			} catch (error) {
				this.instance.log('error', `Error stopping key listener: ${error.message}`)
			}
		}
	}

	findKeyConfig(keyName) {
		// Try case-insensitive match first
		let result = this.instance.monitoredKeys.find(k => 
			k.value.toLowerCase() === keyName.toLowerCase()
		)
		
		if (!result) {
			// Try matching with additional checks for special cases
			result = this.instance.monitoredKeys.find(k => {
				// Try exact match
				if (k.value === keyName) return true
				
				// Try with/without spaces for keys like PageUp vs Page Up
				if (k.value.replace(/\s+/g, '') === keyName.replace(/\s+/g, '')) return true
				
				// Special case for modifier keys - preserve LEFT/RIGHT distinction
				if (keyName.includes('LEFT ') || keyName.includes('RIGHT ')) {
					if (k.value === keyName) return true
				}

				// Special cases for control keys
				if ((keyName === 'Control' && k.value === 'CTRL') ||
				    (keyName === 'CTRL' && k.value === 'Control')) {
					return true
				}

				// Handle numpad keys
				if (keyName.startsWith('NUMPAD ') && k.value === keyName.substring(7)) {
					return true
				}
				
				// Special case for CapsLock
				if ((keyName === 'CAPS LOCK' && k.value === 'CapsLock') ||
				    (keyName === 'CapsLock' && k.value === 'CAPS LOCK')) {
					return true
				}
				
				return false
			})
		}
		
		return result
	}

	normalizeKeyName(keyName) {
		this.instance.log('debug', `Normalizing key name: ${keyName}`)

		// Handle arrow keys correctly (don't remove LEFT/RIGHT if they're part of arrow key names)
		if (keyName === 'LEFT ARROW') return 'ArrowLeft'
		if (keyName === 'RIGHT ARROW') return 'ArrowRight'
		if (keyName === 'UP ARROW') return 'ArrowUp'
		if (keyName === 'DOWN ARROW') return 'ArrowDown'
		
		// Special handling for caps lock
		if (keyName === 'CAPS LOCK') return 'CapsLock'
		
		// Special handling for control keys with explicit LEFT/RIGHT prefix
		if (keyName === 'LEFT CTRL') return 'LEFT Control'
		if (keyName === 'RIGHT CTRL') return 'RIGHT Control'
		if (keyName === 'LEFT ALT') return 'LEFT Alt'
		if (keyName === 'RIGHT ALT') return 'RIGHT Alt'
		if (keyName === 'LEFT SHIFT') return 'LEFT Shift'
		if (keyName === 'RIGHT SHIFT') return 'RIGHT Shift'
		
		// Handle numpad keys
		if (keyName.startsWith('NUMPAD ')) {
			const numpadValue = keyName.substring(7);
			if (/^\d$/.test(numpadValue)) {
				return `Numpad${numpadValue}`
			}
			return `Numpad${numpadValue}`
		}
			
		// Handle keys with LEFT/RIGHT prefix for other keys
		if (keyName.startsWith('LEFT ')) {
			this.instance.log('debug', `Removing LEFT prefix from: ${keyName}`)
			keyName = keyName.substring(5)
		} else if (keyName.startsWith('RIGHT ')) {
			this.instance.log('debug', `Removing RIGHT prefix from: ${keyName}`)
			keyName = keyName.substring(6)
		}

		// Handle page up/down with/without space
		if (keyName.toLowerCase() === 'page up') return 'PageUp'
		if (keyName.toLowerCase() === 'page down') return 'PageDown'
		if (keyName.toLowerCase() === 'pageup') return 'PageUp'
		if (keyName.toLowerCase() === 'pagedown') return 'PageDown'
		
		// Handle arrow keys with different formats
		if (keyName.toLowerCase() === 'up arrow') return 'ArrowUp'
		if (keyName.toLowerCase() === 'down arrow') return 'ArrowDown'
		if (keyName.toLowerCase() === 'left arrow') return 'ArrowLeft'
		if (keyName.toLowerCase() === 'right arrow') return 'ArrowRight'
		if (keyName.toLowerCase() === 'up') return 'ArrowUp'
		if (keyName.toLowerCase() === 'down') return 'ArrowDown'
		if (keyName.toLowerCase() === 'left') return 'ArrowLeft'
		if (keyName.toLowerCase() === 'right') return 'ArrowRight'

		// Handle special keys and normalize naming
		switch (keyName.toLowerCase()) {
			case 'space':
				return 'Space'
			case 'tab':
				return 'Tab'
			case 'escape':
				return 'Escape'
			case 'esc':
				return 'Escape'
			case 'enter':
				return 'Enter'
			case 'return':
				return 'Enter'
			case 'control':
				return 'Control'
			case 'ctrl':
				return 'Control'
			case 'alt':
				return 'Alt'
			case 'shift':
				return 'Shift'  
			case 'meta':
				return 'Meta'
			case 'win':
				return 'Meta'
			case 'windows':
				return 'Meta'
			case 'capslock':
				return 'CapsLock'
			case 'caps':
				return 'CapsLock'
			case 'home':
				return 'Home'
			case 'end':
				return 'End'
			case 'insert':
				return 'Insert'
			case 'ins':
				return 'Insert'
			case 'delete':
				return 'Delete'
			case 'del':
				return 'Delete'
			case 'backspace':
				return 'Backspace'
			case 'back':
				return 'Backspace'
			case 'arrowup':
				return 'ArrowUp'
			case 'arrowdown':
				return 'ArrowDown'
			case 'arrowleft':
				return 'ArrowLeft'
			case 'arrowright':
				return 'ArrowRight'
			case 'numlock':
				return 'NumLock'
			case 'scrolllock':
				return 'ScrollLock'
			case 'printscreen':
				return 'PrintScreen'
			case 'prtsc':
				return 'PrintScreen'
			case 'pause':
				return 'Pause'
			case 'break':
				return 'Pause'
			// Numpad keys
			case 'numpad 0':
				return 'Numpad0'
			case 'numpad 1':
				return 'Numpad1'
			case 'numpad 2':
				return 'Numpad2'
			case 'numpad 3':
				return 'Numpad3'
			case 'numpad 4':
				return 'Numpad4'
			case 'numpad 5':
				return 'Numpad5'
			case 'numpad 6':
				return 'Numpad6'
			case 'numpad 7':
				return 'Numpad7'
			case 'numpad 8':
				return 'Numpad8'
			case 'numpad 9':
				return 'Numpad9'
			case 'numpad add':
				return 'NumpadAdd'
			case 'numpad subtract':
				return 'NumpadSubtract'
			case 'numpad multiply':
				return 'NumpadMultiply'
			case 'numpad divide':
				return 'NumpadDivide'
			case 'numpad decimal':
				return 'NumpadDecimal'
			case 'numpad enter':
				return 'NumpadEnter'
			default:
				return keyName
		}
	}
}

module.exports = KeyListener
