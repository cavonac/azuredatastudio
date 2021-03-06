/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';
import * as vscode from 'vscode';
import { IconPathHelper } from '../../constants/iconPathHelper';
import { MigrationContext } from '../../models/migrationLocalStorage';
import { MigrationCutoverDialog } from '../migrationCutover/migrationCutoverDialog';
import { MigrationCategory, MigrationStatusDialogModel } from './migrationStatusDialogModel';
import * as loc from '../../constants/strings';
export class MigrationStatusDialog {
	private _model: MigrationStatusDialogModel;
	private _dialogObject!: azdata.window.Dialog;
	private _view!: azdata.ModelView;
	private _searchBox!: azdata.InputBoxComponent;
	private _refresh!: azdata.ButtonComponent;
	private _statusDropdown!: azdata.DropDownComponent;
	private _statusTable!: azdata.DeclarativeTableComponent;

	constructor(migrations: MigrationContext[], private _filter: MigrationCategory) {
		this._model = new MigrationStatusDialogModel(migrations);
		this._dialogObject = azdata.window.createModelViewDialog(loc.MIGRATION_STATUS, 'MigrationControllerDialog', 'wide');
	}

	initialize() {
		let tab = azdata.window.createTab('');
		tab.registerContent((view: azdata.ModelView) => {
			this._view = view;

			this._statusDropdown = this._view.modelBuilder.dropDown().withProps({
				values: this._model.statusDropdownValues,
				width: '220px'
			}).component();

			this._statusDropdown.onValueChanged((value) => {
				this.populateMigrationTable();
			});

			this._statusDropdown.value = this._statusDropdown.values![this._filter];

			const formBuilder = view.modelBuilder.formContainer().withFormItems(
				[
					{
						component: this.createSearchAndRefreshContainer()
					},
					{
						component: this._statusDropdown
					},
					{
						component: this.createStatusTable()
					}
				],
				{
					horizontal: false
				}
			);
			const form = formBuilder.withLayout({ width: '100%' }).component();
			return view.initializeModel(form);
		});
		this._dialogObject.content = [tab];
		azdata.window.openDialog(this._dialogObject);
	}

	private createSearchAndRefreshContainer(): azdata.FlexContainer {
		this._searchBox = this._view.modelBuilder.inputBox().withProps({
			placeHolder: loc.SEARCH_FOR_MIGRATIONS,
			width: '360px'
		}).component();

		this._searchBox.onTextChanged((value) => {
			this.populateMigrationTable();
		});

		this._refresh = this._view.modelBuilder.button().withProps({
			iconPath: {
				light: IconPathHelper.refresh.light,
				dark: IconPathHelper.refresh.dark
			},
			iconHeight: '16px',
			iconWidth: '16px',
			height: '30px',
			label: 'Refresh',
		}).component();

		const flexContainer = this._view.modelBuilder.flexContainer().component();

		flexContainer.addItem(this._searchBox, {
			flex: '0'
		});

		flexContainer.addItem(this._refresh, {
			flex: '0',
			CSSStyles: {
				'margin-left': '20px'
			}
		});

		return flexContainer;
	}

	private populateMigrationTable(): void {

		try {
			const migrations = this._model.filterMigration(
				this._searchBox.value!,
				(<azdata.CategoryValue>this._statusDropdown.value).name
			);

			const data: azdata.DeclarativeTableCellValue[][] = [];

			migrations.forEach((migration) => {
				const migrationRow: azdata.DeclarativeTableCellValue[] = [];

				const databaseHyperLink = this._view.modelBuilder.hyperlink().withProps({
					label: migration.migrationContext.name,
					url: ''
				}).component();
				databaseHyperLink.onDidClick(async (e) => {
					await (new MigrationCutoverDialog(migration)).initialize();
				});
				migrationRow.push({
					value: databaseHyperLink,
				});

				migrationRow.push({
					value: migration.migrationContext.properties.migrationStatus
				});

				const sqlMigrationIcon = this._view.modelBuilder.image().withProps({
					iconPath: IconPathHelper.sqlMigrationLogo,
					iconWidth: '16px',
					iconHeight: '16px',
					width: '32px',
					height: '20px'
				}).component();
				const sqlMigrationName = this._view.modelBuilder.hyperlink().withProps({
					label: migration.migrationContext.name,
					url: ''
				}).component();
				sqlMigrationName.onDidClick((e) => {
					vscode.window.showInformationMessage('Feature coming soon');
				});

				const sqlMigrationContainer = this._view.modelBuilder.flexContainer().withProps({
					CSSStyles: {
						'justify-content': 'center'
					}
				}).component();
				sqlMigrationContainer.addItem(sqlMigrationIcon, {
					flex: '0',
					CSSStyles: {
						'width': '32px'
					}
				});
				sqlMigrationContainer.addItem(sqlMigrationName,
					{
						CSSStyles: {
							'width': 'auto'
						}
					});
				migrationRow.push({
					value: sqlMigrationContainer
				});

				migrationRow.push({
					value: loc.ONLINE
				});

				migrationRow.push({
					value: '---'
				});
				migrationRow.push({
					value: '---'
				});

				data.push(migrationRow);
			});

			this._statusTable.dataValues = data;
		} catch (e) {
			console.log(e);
		}
	}

	private createStatusTable(): azdata.DeclarativeTableComponent {
		this._statusTable = this._view.modelBuilder.declarativeTable().withProps({
			columns: [
				{
					displayName: loc.DATABASE,
					valueType: azdata.DeclarativeDataType.component,
					width: '100px',
					isReadOnly: true,
					rowCssStyles: {
						'text-align': 'center'
					}
				},
				{
					displayName: loc.MIGRATION_STATUS,
					valueType: azdata.DeclarativeDataType.string,
					width: '150px',
					isReadOnly: true,
					rowCssStyles: {
						'text-align': 'center'
					}
				},
				{
					displayName: loc.TARGET_AZURE_SQL_INSTANCE_NAME,
					valueType: azdata.DeclarativeDataType.component,
					width: '300px',
					isReadOnly: true,
					rowCssStyles: {
						'text-align': 'center'
					}
				},
				{
					displayName: loc.CUTOVER_TYPE,
					valueType: azdata.DeclarativeDataType.string,
					width: '100px',
					isReadOnly: true,
					rowCssStyles: {
						'text-align': 'center'
					}
				},
				{
					displayName: loc.START_TIME,
					valueType: azdata.DeclarativeDataType.string,
					width: '150px',
					isReadOnly: true,
					rowCssStyles: {
						'text-align': 'center'
					}
				},
				{
					displayName: loc.FINISH_TIME,
					valueType: azdata.DeclarativeDataType.string,
					width: '150px',
					isReadOnly: true,
					rowCssStyles: {
						'text-align': 'center'
					}
				}
			]
		}).component();
		return this._statusTable;
	}
}
