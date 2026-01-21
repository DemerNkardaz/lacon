/**
 * Декораторы для функций форматирования @f
 */

import * as vscode from 'vscode';
import { executeFunctionCall } from '../laconToJson/elements/function-parser';
import { createDecoratorStyle, createDecorationOptions, COLOR_SCHEMES } from './styles';
import { DecoratorContext } from './types';
import { isInEmbeddedLanguage } from './utils';

/**
 * Создает декораторы для функций форматирования на видимых строках
 * @param context - Контекст декоратора
 * @param visibleRange - Видимый диапазон редактора
 * @param activeLines - Набор активных строк (с курсором)
 * @returns Массив опций декораторов
 */
export function createFunctionDecorators(
	context: DecoratorContext,
	visibleRange: vscode.Range,
	activeLines: Set<number>
): vscode.DecorationOptions[] {
	const decorations: vscode.DecorationOptions[] = [];
	const { editor, variables, embeddedRanges } = context;

	const functionRegEx = /@f\(([^"]+),\s([^)]+)\)/g;
	const startLine = Math.max(0, visibleRange.start.line - 5);
	const endLine = Math.min(editor.document.lineCount - 1, visibleRange.end.line + 5);

	for (let i = startLine; i <= endLine; i++) {
		if (activeLines.has(i)) continue;

		const line = editor.document.lineAt(i);
		const lineOffset = editor.document.offsetAt(line.range.start);

		if (isInEmbeddedLanguage(lineOffset, embeddedRanges)) continue;

		// Пропускаем строки с <emit:> для функций
		if (line.text.includes('<emit:')) continue;

		functionRegEx.lastIndex = 0;
		let match;
		while ((match = functionRegEx.exec(line.text))) {
			try {
				const globalVarsObj: Record<string, string> = {};
				variables.variables.forEach((info, name) => {
					globalVarsObj[name] = info.value;
				});
				const result = executeFunctionCall(match[0], globalVarsObj);

				const style = createDecoratorStyle({
					contentText: result,
					fontStyle: 'italic',
					...COLOR_SCHEMES.function,
				});

				decorations.push(
					createDecorationOptions(new vscode.Range(i, match.index, i, match.index + match[0].length), style)
				);
			} catch {
				// Игнорируем ошибки выполнения функций
			}
		}
	}

	return decorations;
}
