/**
 * Главный модуль декораторов LACON
 */

import * as vscode from 'vscode';
import { DecoratorContext, VariableStorage } from './types';
import { collectVariables } from './variables';
import { getEmbeddedLanguageRanges } from './utils';
import { createEmitDecorators } from './emit-decorators';
import { createUnicodeDecorators } from './unicode-decorators';
import { createFunctionDecorators } from './functions-decorators';
import { createVariableDecorators } from './variable-decorators';
import { createHoverProvider } from './hover';

/**
 * Менеджер декораторов для LACON
 */
export class DecoratorManager {
	private variables: VariableStorage;
	private lastText: string = '';
	private decorationType: vscode.TextEditorDecorationType;

	constructor() {
		this.variables = {
			variables: new Map(),
			localVariables: new Map(),
		};

		this.decorationType = vscode.window.createTextEditorDecorationType({
			textDecoration: 'none; display: none;',
			cursor: 'pointer',
		});
	}

	/**
	 * Обновляет декораторы в редакторе
	 * @param editor - Текущий редактор
	 * @param onlyCursorMove - Флаг обновления только при движении курсора
	 */
	updateDecorations(editor: vscode.TextEditor, onlyCursorMove: boolean = false): void {
		const text = editor.document.getText();
		const embeddedRanges = getEmbeddedLanguageRanges(text);

		// Обновляем переменные только если текст изменился
		if (!onlyCursorMove || text !== this.lastText) {
			this.variables = collectVariables(text, editor);
			this.lastText = text;
		}

		const context: DecoratorContext = {
			editor,
			variables: this.variables,
			embeddedRanges,
		};

		const decorations: vscode.DecorationOptions[] = [];
		const selections = editor.selections;
		const activeLines = new Set(selections.map((s) => s.active.line));

		// Собираем декораторы со всех видимых диапазонов
		for (const visibleRange of editor.visibleRanges) {
			decorations.push(...createEmitDecorators(context, visibleRange, activeLines));
			decorations.push(...createFunctionDecorators(context, visibleRange, activeLines));
			decorations.push(...createUnicodeDecorators(context, visibleRange, activeLines));
			decorations.push(...createVariableDecorators(context, visibleRange, activeLines));
		}

		editor.setDecorations(this.decorationType, decorations);
	}

	/**
	 * Создает hover провайдер
	 * @returns Hover провайдер для регистрации
	 */
	createHoverProvider(): vscode.HoverProvider {
		// Передаем функцию для получения актуальных variables
		return createHoverProvider(() => this.variables);
	}

	/**
	 * Освобождает ресурсы
	 */
	dispose(): void {
		this.decorationType.dispose();
	}
}

// Экспорт типов и утилит
export * from './types';
export * from './styles';
export * from './variables';
export * from './utils';
export * from './markdown-builder';
