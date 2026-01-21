/**
 * Декораторы для Unicode последовательностей
 */

import * as vscode from 'vscode';
import { createDecoratorStyle, createDecorationOptions, COLOR_SCHEMES } from './styles';
import { DecoratorContext } from './types';
import { isInEmbeddedLanguage } from './utils';

/**
 * Создает декораторы для Unicode последовательностей на видимых строках
 * @param context - Контекст декоратора
 * @param visibleRange - Видимый диапазон редактора
 * @param activeLines - Набор активных строк (с курсором)
 * @returns Массив опций декораторов
 */
export function createUnicodeDecorators(
	context: DecoratorContext,
	visibleRange: vscode.Range,
	activeLines: Set<number>
): vscode.DecorationOptions[] {
	const decorations: vscode.DecorationOptions[] = [];
	const { editor, embeddedRanges } = context;

	const unicodeRegEx = /\\u\{([0-9a-fA-F]+)\}/g;
	const startLine = Math.max(0, visibleRange.start.line - 5);
	const endLine = Math.min(editor.document.lineCount - 1, visibleRange.end.line + 5);

	for (let i = startLine; i <= endLine; i++) {
		if (activeLines.has(i)) continue;

		const line = editor.document.lineAt(i);
		const lineOffset = editor.document.offsetAt(line.range.start);

		if (isInEmbeddedLanguage(lineOffset, embeddedRanges)) continue;

		unicodeRegEx.lastIndex = 0;
		let match;
		while ((match = unicodeRegEx.exec(line.text))) {
			try {
				const char = String.fromCodePoint(parseInt(match[1], 16));
				const style = createDecoratorStyle({
					contentText: char,
					...COLOR_SCHEMES.unicode,
				});

				decorations.push(
					createDecorationOptions(new vscode.Range(i, match.index, i, match.index + match[0].length), style)
				);
			} catch {
				// Игнорируем ошибки парсинга
			}
		}
	}

	return decorations;
}
