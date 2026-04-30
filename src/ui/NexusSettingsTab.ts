import { App, PluginSettingTab, Setting, debounce } from 'obsidian';
import NexusPlugin from '../main';
import { INexusSettings } from '../core/types';

export class NexusSettingsTab extends PluginSettingTab {
	plugin: NexusPlugin;

	constructor(app: App, plugin: NexusPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Nexus: Core Modules' });

		new Setting(containerEl)
			.setName('Semantic Engine')
			.setDesc('Enable/Disable link visualization and parsing.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableModules.semantic)
				.onChange(async (value) => {
					this.plugin.settings.enableModules.semantic = value;
					await this.plugin.saveSettings();
					this.plugin.refresh();
				}));

		new Setting(containerEl)
			.setName('Sync Master')
			.setDesc('Enable/Disable bidirectional link synchronization.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableModules.sync)
				.onChange(async (value) => {
					this.plugin.settings.enableModules.sync = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Dead Link Watcher')
			.setDesc('Enable/Disable scanning for broken semantic links.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableModules.deadLinks)
				.onChange(async (value) => {
					this.plugin.settings.enableModules.deadLinks = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h2', { text: 'Semantic Settings' });

		// ФИКС P18/P19: Используем Obsidian debounce и immediate = false
		const saveDebounced = debounce(async () => {
			await this.plugin.saveSettings();
			this.plugin.refresh();
		}, 500, false);

		new Setting(containerEl)
			.setName('Trusted Link Types')
			.setDesc('Список типов связей, которые плагин будет считать семантическими.')
			.then(setting => {
				const cloudEl = containerEl.createDiv({ cls: 'nexus-tag-cloud' });
				
				const renderPills = () => {
					cloudEl.empty();
					this.plugin.settings.semantic.trustedTypes.forEach(type => {
						const pill = cloudEl.createDiv({ cls: 'nexus-tag-pill', text: type });
						const removeBtn = pill.createSpan({ cls: 'nexus-tag-pill-remove', text: '×' });
						removeBtn.onclick = async () => {
							this.plugin.settings.semantic.trustedTypes = 
								this.plugin.settings.semantic.trustedTypes.filter(t => t !== type);
							await this.plugin.saveSettings();
							this.plugin.refresh();
							renderPills();
						};
					});
				};

				renderPills();

				const inputContainer = containerEl.createDiv({ cls: 'nexus-tag-input-container' });
				const inputEl = inputContainer.createEl('input', { 
					cls: 'nexus-tag-input',
					attr: { type: 'text', placeholder: 'Add new type (e.g. supports)...' }
				});
				
				const addBtn = inputContainer.createEl('button', {
					cls: 'nexus-tag-add-btn',
					text: 'Add'
				});

				const handleAdd = async () => {
					const val = inputEl.value.trim();
					if (val && !this.plugin.settings.semantic.trustedTypes.includes(val)) {
						this.plugin.settings.semantic.trustedTypes.push(val);
						await this.plugin.saveSettings();
						this.plugin.refresh();
						inputEl.value = '';
						renderPills();
					}
				};

				addBtn.onclick = handleAdd;
				inputEl.onkeydown = (e) => {
					if (e.key === 'Enter') handleAdd();
				};
			});

		new Setting(containerEl)
			.setName('Semantic Aliases')
			.setDesc('Включить поддержку синтаксиса [[Note|type]].')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.semantic.syntaxOptions.alias)
				.onChange(async (value) => {
					this.plugin.settings.semantic.syntaxOptions.alias = value;
					await this.plugin.saveSettings();
					this.plugin.refresh();
				}));

		new Setting(containerEl)
			.setName('Dataview Inline Fields')
			.setDesc('Включить поддержку синтаксиса type:: [[Note]].')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.semantic.syntaxOptions.dataview)
				.onChange(async (value) => {
					this.plugin.settings.semantic.syntaxOptions.dataview = value;
					await this.plugin.saveSettings();
					this.plugin.refresh();
				}));

		containerEl.createEl('h3', { text: 'Synchronization (Sync Master)' });

		new Setting(containerEl)
			.setName('Sync Mode')
			.setDesc('Куда записывать ответные двусторонние связи.')
			.addDropdown(dropdown => dropdown
				.addOption('properties', 'YAML Properties')
				.addOption('off', 'Disabled')
				.setValue(this.plugin.settings.sync.mode)
				.onChange(async (value) => {
					this.plugin.settings.sync.mode = value as INexusSettings['sync']['mode'];
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Target Property')
			.setDesc('Имя ключа в YAML для хранения связей.')
			.addText(text => text
				.setPlaceholder('nexus-relations')
				.setValue(this.plugin.settings.sync.targetProperty)
				.onChange(async (value) => {
					this.plugin.settings.sync.targetProperty = value;
					saveDebounced();
				}));
	}
}
