/**
 * Декораторы для переменных (глобальных и локальных)
 */

import * as vscode from 'vscode';
import { createDecoratorStyle, createDecorationOptions, COLOR_SCHEMES } from './styles';
import { DecoratorContext } from './types';
import { isInEmbeddedLanguage } from './utils';
import { replaceUnicodeSequences, findInnermostLocalVariable } from './variables';

/**
 * Создает декораторы для переменных на видимых строках
 * @param context - Контекст декоратора
 * @param visibleRange - Видимый диапазон редактора
 * @param activeLines - Набор активных строк (с курсором)
 * @returns Массив опций декораторов
 */
export function createVariableDecorators(
	context: DecoratorContext,
	visibleRange: vscode.Range,
	activeLines: Set<number>
): vscode.DecorationOptions[] {
	const decorations: vscode.DecorationOptions[] = [];
	const { editor, variables, embeddedRanges } = context;

	const varUsageRegEx = /(?<!\\)\$([\p{L}_](?:[\p{L}0-9._-]*[\p{L}0-9_])?)(~?)/gum;
	const startLine = Math.max(0, visibleRange.start.line - 5);
	const endLine = Math.min(editor.document.lineCount - 1, visibleRange.end.line + 5);

	for (let i = startLine; i <= endLine; i++) {
		if (activeLines.has(i)) continue;

		const line = editor.document.lineAt(i);
		const lineOffset = editor.document.offsetAt(line.range.start);

		if (isInEmbeddedLanguage(lineOffset, embeddedRanges)) continue;

		varUsageRegEx.lastIndex = 0;
		let match;
		while ((match = varUsageRegEx.exec(line.text))) {
			const varName = match[1];
			const lineLocals = variables.localVariables.get(i);

			// Найти самую внутреннюю (ближайшую) локальную переменную
			const localVar = findInnermostLocalVariable(varName, lineLocals);

			if (localVar) {
				// Локальная переменная
				const style = createDecoratorStyle({
					contentText: localVar.value,
					fontStyle: 'italic',
					...COLOR_SCHEMES.localVar,
				});

				decorations.push(
					createDecorationOptions(new vscode.Range(i, match.index, i, match.index + match[0].length), style)
				);
			} else {
				// Глобальная переменная
				const varInfo = variables.variables.get(varName);
				if (varInfo && i > varInfo.line) {
					const displayValue = replaceUnicodeSequences(varInfo.value);
					const hasCJK = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(displayValue);

					const style = createDecoratorStyle({
						contentText: displayValue,
						fontStyle: hasCJK ? 'normal' : 'italic',
						...COLOR_SCHEMES.globalVar,
					});

					decorations.push(
						createDecorationOptions(new vscode.Range(i, match.index, i, match.index + match[0].length), style)
					);
				}
			}
		}
	}

	return decorations;
}
