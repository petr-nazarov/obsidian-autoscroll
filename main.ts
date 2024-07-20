import { App, Editor, Notice, Plugin, PluginSettingTab, Setting, addIcon, MarkdownView } from 'obsidian';

interface AutoScrollSettings {
	speed: number;
}

const DEFAULT_SETTINGS: AutoScrollSettings = {
	speed: 0.2
}
const ribbonActiveClassName = 'autoscroll-ribbon-active';
export default class AutoScrollPlugin extends Plugin {
	settings: AutoScrollSettings;
	active: boolean = false;
	intervalId: number;
	pixelfractionCounter: number = 0;

	private stopScroll() {
		window.clearInterval(this.intervalId);
		this.active = false;
	}
	private performScroll() {
		this.pixelfractionCounter += this.settings.speed;
		if (this.pixelfractionCounter < 1)
			return;

		const editor = app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		if (editor) {
			const { top, left } = editor.getScrollInfo();
			editor.scrollTo(left, top + this.pixelfractionCounter);
			this.pixelfractionCounter %= 1;

			const { top: newTop } = editor.getScrollInfo();
			if (top === newTop) {
				new Notice('Scrolled to the end!');
				this.stopScroll()
			}
		}
		else {
			new Notice('Editor view lost');
			this.stopScroll()
		}
	}

	async onload() {
		this.active = false;
		await this.loadSettings();

		this.addCommand({
			id: "autoscroller-toggle-scrolling",
			name: "Autoscroller: toggle scrolling",
			callback: () => {
				if (this.active) {
					new Notice('Stopping Auto Scroller');
					this.stopScroll()
				} else {
					new Notice('Starting Auto Scroller');
					this.active = true;
					this.intervalId = this.registerInterval(window.setInterval(() => this.performScroll(), 10));
				}
			},
		})
		this.addCommand({
			id: "autoscroller-increase-speed",
			name: "Autoscroller: increase speed",
			callback: () => {
				if (this.settings.speed >= 2) {
					this.settings.speed = .1
				} else {
					// to mitigate precision issues (e.g. avoid .1 + .1 = .20000000001)
					this.settings.speed = Math.round(this.settings.speed * 10 + 1) / 10
				}
				new Notice('Setting speed to ' + this.settings.speed);
			},
		})
		this.addCommand({
			id: "autoscroller-decrease-speed",
			name: "Autoscroller: decrease speed",
			callback: () => {
				if (this.settings.speed <= .1) {
					this.settings.speed = 2
				} else {
					// to mitigate precision issues (e.g. avoid .1 + .1 = .20000000001)
					this.settings.speed = Math.round(this.settings.speed * 10 - 1) / 10
				}
				new Notice('Setting speed to ' + this.settings.speed);
			},
		})

		this.addSettingTab(new AutoScrollSettingTab(this.app, this));
	}

	onunload() {
		window.clearInterval(this.intervalId);
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
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for Autoscroll Plugin' });

		new Setting(containerEl)
			.setName('Default scrolling speed')
			.setDesc('The number of pixels to pass in 10 ms')
			.addSlider((slider) => slider
				.setLimits(.1, 2, .1)
				.setValue(this.plugin.settings.speed)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.speed = value;
					await this.plugin.saveSettings();
				})
			)
	}
}
