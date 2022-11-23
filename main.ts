import { App, Editor,  Notice, Plugin, PluginSettingTab, Setting, addIcon } from 'obsidian';
// Remember to rename these classes and interfaces!


interface AutoScrollSettings {
	speed: string;
}

const DEFAULT_SETTINGS: AutoScrollSettings = {
	speed: '0.2'
}
const allowedSpeeds = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.5, 2];
const ribbonActiveClassName = 'autoscroll-ribbon-active';
export default class AutoScrollPlugin extends Plugin {
	settings: AutoScrollSettings;
	active: boolean = false;
	intervalId: number;
	ribbonIconEl: HTMLElement;
	currentTop: number = 0;
	nextTop: number =0;
	/**
	 * The ammount of pixels to pass in 10 ms
	 */
	speed: number 

	private stopScroll(text: string = 'Stopping Auto Scroller') {
		window.clearInterval(this.intervalId);
		this.active = false;
		this.ribbonIconEl.removeClass(ribbonActiveClassName);
		new Notice(text);
	}
	private performScroll() {
			if(this.app.workspace.activeLeaf){
				const editor = (this.app.workspace.activeLeaf.view as any).editor as Editor;
				const {top, left} = editor.getScrollInfo();
				// console.log({
				// 	currentTop: this.currentTop,
				// 	nextTop :this.nextTop,
				// })
				if (this.nextTop - this.currentTop > 1) {
					// console.log('scrolling')
					editor.scrollTo(left, this.nextTop);
					const {top:newTop, left: newLeft} = editor.getScrollInfo();
					this.currentTop = newTop;
					if (newTop === this.nextTop) {
						this.stopScroll('Scrolled to the end!');

					} 
				} else{
					this.currentTop = top;
					this.nextTop += this.speed;
				}
			}
		
	}
	private increaseSpeed() {
		const currentSpeedIndex = allowedSpeeds.indexOf(this.speed) || allowedSpeeds.indexOf(0.5);
		if(currentSpeedIndex === allowedSpeeds.length - 1) {
			this.speed = allowedSpeeds[0];
		} else {
			this.speed = allowedSpeeds[currentSpeedIndex + 1];
		}
		new Notice('Setting speed to ' + this.speed);
		
	}
	async onload() {
		this.active = false;
		await this.loadSettings();
		this.speed = parseFloat(this.settings.speed);

		// This creates an icon in the left ribbon.
		this.ribbonIconEl = this.addRibbonIcon('double-down-arrow-glyph', `Auto Scroller (speed ${this.speed})`, (evt: MouseEvent) => {
			
			// Clicked with left mouse button
			if (evt.button === 0) {
				const currentState = this.active;
				if (currentState) {
					this.stopScroll()
				} else{
					new Notice('Starting Auto Scroller');
					this.ribbonIconEl.addClass(ribbonActiveClassName);
					this.active = true;
					this.speed = parseFloat(this.settings.speed);
					this.intervalId = this.registerInterval(window.setInterval(() => this.performScroll(),  10));
				}
			} else{
				// Clicked with right mouse button
				this.increaseSpeed();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AutoScrollSettingTab(this.app, this));

	}

	onunload() {
		// window.clearInterval(this.intervalId);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}



class AutoScrollSettingTab extends PluginSettingTab {
	plugin: AutoScrollPlugin;

	constructor(app: App, plugin: AutoScrollPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		const speedOptions = allowedSpeeds.reduce((acc, speed) => {
			const strSpeed =  `${speed}`
			acc[strSpeed] = strSpeed;
			return acc;
		}, {} as Record<string, string>);

		containerEl.createEl('h2', {text: 'Settings for Autoscroll Plugin'});

		new Setting(containerEl)
			.setName('Default scrolling speed')
			.setDesc('The amount of pixels to pass in 10 ms')
			.addDropdown((dropdown) => dropdown.addOptions(speedOptions)
			.onChange(async (value) => {
				// console.log('Secret: ' + value);
			 	this.plugin.settings.speed = value;
				await this.plugin.saveSettings();
			})
			)
		
	}
}
