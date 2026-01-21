/**
 * Hover провайдер для LACON
 */

import * as vscode from 'vscode';
import * as l10n from '@vscode/l10n';
import { parseEmitDirective } from '../laconToJson/emit-parser';
import { executeFunctionCall } from '../laconToJson/function-parser';
import { VariableStorage } from './types';
import { getEmbeddedLanguageRanges, isInEmbeddedLanguage } from './utils';
import { replaceUnicodeSequences, findInnermostLocalVariable } from './variables';
import { createMarkdown } from './markdown-builder';

/**
 * Создает markdown с деталями символа Unicode
 */
function getCharDetails(char: string, hex: string): vscode.MarkdownString {
	const codePoint = char.codePointAt(0) || 0;
	let category = 'Unknown';
	if (/\p{L}/u.test(char)) category = l10n.t('unicode.category.letter');
	else if (/\p{N}/u.test(char)) category = l10n.t('unicode.category.number');
	else if (/\p{P}/u.test(char)) category = l10n.t('unicode.category.punctuation');
	else if (/\p{S}/u.test(char)) category = l10n.t('unicode.category.symbol');
	else if (/\p{Z}/u.test(char)) category = l10n.t('unicode.category.separator');

	return createMarkdown()
		.addSection(`${l10n.t('unicode.preview.title')}: U+${hex.toUpperCase()}\n\n`)
		.addSeparator()
		.addSection(`# ${char}\n\n`)
		.addTable(
			[l10n.t('property'), l10n.t('value')],
			[
				[`**${l10n.t('unicode.category')}**`, category],
				['**Dec**', codePoint.toString()],
				['**UTF-16**', `\`\\u${codePoint.toString(16).padStart(4, '0')}\``],
				['**HTML**', `\`&#${codePoint};\``],
			]
		)
		.build();
}

/**
 * Создает markdown с деталями переменной
 */
function getVarDetails(name: string, info: { value: string; line: number; doc?: string }, documentUri: vscode.Uri): vscode.MarkdownString {
	const displayValue = replaceUnicodeSequences(info.value);
	
	// Создаем command link для перехода на строку объявления переменной
	const args = encodeURIComponent(JSON.stringify({
		lineNumber: info.line + 1,
		at: 'top'
	}));
	const lineLink = `[${l10n.t('var.line')} ${info.line + 1}](command:revealLine?${args} "Перейти к объявлению")`;
	
	const builder = createMarkdown()
		.addSection(`${l10n.t('var.title')}$${name}\n\n`)
		.addSeparator();

	if (info.doc) {
		builder.addSection(`${info.doc}\n\n`).addSeparator();
	}

	builder.addTable(
		[l10n.t('property'), l10n.t('value')],
		[
			[`**${l10n.t('var.current')}**`, `\`${displayValue}\``],
			[`**${l10n.t('var.defined')}**`, lineLink],
		]
	);

	const trimmedValue = info.value.replace(/^["']|["']$/g, '').trim();
	const unicodeMatch = trimmedValue.match(/^\\u\{([0-9a-fA-F]+)\}$/);
	if (unicodeMatch) {
		const hex = unicodeMatch[1];
		const char = String.fromCodePoint(parseInt(hex, 16));
		const codePoint = char.codePointAt(0) || 0;
		let category = 'Unknown';
		if (/\p{L}/u.test(char)) category = l10n.t('unicode.category.letter');
		else if (/\p{N}/u.test(char)) category = l10n.t('unicode.category.number');
		else if (/\p{P}/u.test(char)) category = l10n.t('unicode.category.punctuation');
		else if (/\p{S}/u.test(char)) category = l10n.t('unicode.category.symbol');
		else if (/\p{Z}/u.test(char)) category = l10n.t('unicode.category.separator');

		builder
			.addSeparator()
			.addSection(`${l10n.t('unicode.preview.title')}: U+${hex.toUpperCase()}\n\n`)
			.addSection(`# ${char}\n\n`)
			.addTable(
				[l10n.t('property'), l10n.t('value')],
				[
					[`**${l10n.t('unicode.category')}**`, category],
					['**Dec**', codePoint.toString()],
					['**UTF-16**', `\`\\u${codePoint.toString(16).padStart(4, '0')}\``],
					['**HTML**', `\`&#${codePoint};\``],
				]
			);
	}

	return builder.build();
}

/**
 * Создает hover провайдер для LACON
 * @param getVariables - Функция для получения актуальных variables
 */
export function createHoverProvider(
	getVariables: () => VariableStorage
): vscode.HoverProvider {
	return {
		provideHover(document, position) {
			// Получаем актуальные variables
			const variables = getVariables();
			
			const text = document.getText();
			const offset = document.offsetAt(position);
			const embeddedRanges = getEmbeddedLanguageRanges(text);
			if (isInEmbeddedLanguage(offset, embeddedRanges)) return null;

			const lineText = document.lineAt(position.line).text;
			let m;

			// Hover для <emit>
			if (lineText.includes('<emit:')) {
				const directive = parseEmitDirective(lineText);
				if (directive) {
					const emitStart = lineText.indexOf('<emit:');
					const emitEnd = lineText.indexOf('>', emitStart) + 1;
					const range = new vscode.Range(position.line, emitStart, position.line, emitEnd);
					if (range.contains(position)) {
						const endValue = directive.direction === '+' ? directive.end - 1 : directive.end + 1;
						const rows: string[][] = [
							[`**${l10n.t('emit.start')}**`, `0x${directive.start.toString(16).toUpperCase()} (${directive.start})`],
							[`**${l10n.t('emit.end')}**`, `0x${endValue.toString(16).toUpperCase()} (${directive.end})`],
							[`**${l10n.t('emit.count')}**`, `${Math.abs(directive.end - directive.start)}`],
							[`**${l10n.t("emit.direction")}**`, `${directive.direction === '+' ? `${l10n.t("increment")}` : `${l10n.t("decrement")}`}`],
						];
						if (directive.localVar) {
							rows.push([`**${l10n.t('emit.localVar')}**`, `\`$${directive.localVar}\``]);
						}
						if (directive.localVarExpr) {
							rows.push([`**${l10n.t('emit.localVarExpr')}**`, `\`${directive.localVarExpr}\``]);
						}

						const md = createMarkdown()
							.addSection(`${l10n.t('emit.title')}\n\n`)
							.addTable([l10n.t('property'), l10n.t('value')], rows)
							.build();

						return new vscode.Hover(md, range);
					}
				}
			}

			// Hover для функций
			const funcRegex = /@f\(([^"]+),\s([^)]+)\)/g;
			while ((m = funcRegex.exec(lineText)) !== null) {
				const range = new vscode.Range(position.line, m.index, position.line, m.index + m[0].length);
				if (range.contains(position)) {
					const builder = createMarkdown().addSection(`${l10n.t('format.title')}\n\n`);
					try {
						const globalVarsObj: Record<string, string> = {};
						variables.variables.forEach((info, name) => {
							globalVarsObj[name] = info.value;
						});
						const result = executeFunctionCall(m[0], globalVarsObj);
						builder.addBold(l10n.t('format.result')).addText(`: \`${result}\``);
					} catch (e: any) {
						builder.addBold(l10n.t('error')).addText(`: ${e.message}`);
					}
					return new vscode.Hover(builder.build(), range);
				}
			}

			// Hover для Unicode
			const uniRegex = /\\u\{([0-9a-fA-F]+)\}/g;
			while ((m = uniRegex.exec(lineText)) !== null) {
				const range = new vscode.Range(position.line, m.index, position.line, m.index + m[0].length);
				if (range.contains(position)) {
					return new vscode.Hover(getCharDetails(String.fromCodePoint(parseInt(m[1], 16)), m[1]), range);
				}
			}

			// Hover для переменных
			const varRegex = /\$([\p{L}_](?:[\p{L}0-9._-]*[\p{L}0-9_])?)(~?)/gum;
			while ((m = varRegex.exec(lineText)) !== null) {
				const range = new vscode.Range(position.line, m.index, position.line, m.index + m[0].length);
				if (range.contains(position)) {
					const lineLocals = variables.localVariables.get(position.line);

					// Найти самую внутреннюю локальную переменную
					const localVar = findInnermostLocalVariable(m[1], lineLocals);

					if (localVar) {
						const md = createMarkdown()
							.addSection(`${l10n.t('var.local.title')}$${m[1]}\n\n`)
							.addTable(
								[l10n.t('property'), l10n.t('value')],
								[
									[`**${l10n.t('type')}**`, 'Local (emit)'],
									[`**${l10n.t('var.current')}**`, `\`${localVar.value}\``],
								]
							)
							.addText(`\n${l10n.t('var.local.description')}\n`)
							.build();
						return new vscode.Hover(md, range);
					}
					const info = variables.variables.get(m[1]);
					if (info && position.line > info.line) return new vscode.Hover(getVarDetails(m[1], info, document.uri), range);
				}
			}
			return null;
		},
	};
}
