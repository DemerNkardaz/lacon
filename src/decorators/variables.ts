/**
 * Сбор и обработка переменных LACON
 */

import * as vscode from 'vscode';
import { parseEmitDirective } from '../laconToJson/directives/emit-parser';
import { executeFunctionCall } from '../laconToJson/elements/function-parser';
import { VariableStorage, VariableInfo, LocalVariableInfo } from './types';

/**
 * Собирает глобальные и локальные переменные из текста
 * @param text - Текст документа
 * @param editor - Текущий редактор
 * @returns Хранилище переменных
 */
export function collectVariables(text: string, editor: vscode.TextEditor): VariableStorage {
	const variables = new Map<string, VariableInfo>();
	const localVariables = new Map<number, Map<string, LocalVariableInfo>>();

	// 1. Сбор глобальных переменных
	const combinedRegex = /(?:\/\*\*([\s\S]*?)\*\/[\r\n\s]*)?^(?<!\\)\$([\p{L}_](?:[\p{L}0-9._-]*[\p{L}0-9_])?)(?:\s*=\s*|\s+)(.+)$/gum;
	let match;
	while ((match = combinedRegex.exec(text))) {
		const rawDoc = match[1];
		const varName = match[2];
		const varValue = match[3].trim();
		const line = editor.document.positionAt(match.index + match[0].indexOf('$')).line;
		let cleanDoc = rawDoc
			? rawDoc
					.split('\n')
					.map((l) => l.replace(/^\s*\* ?/, '').trim())
					.filter((l) => l !== '')
					.join('\n')
			: undefined;
		variables.set(varName, { value: varValue, line: line, doc: cleanDoc });
	}

	// 2. Сбор локальных переменных из emit директив
	const lines = text.split('\n');
	
	// Отслеживаем блочные комментарии /* */
	let inBlockComment = false;
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmedLine = line.trim();
		
		// Проверяем начало и конец блочных комментариев
		if (trimmedLine.includes('/*')) {
			inBlockComment = true;
		}
		if (trimmedLine.includes('*/')) {
			inBlockComment = false;
			continue; // Пропускаем строку с закрывающим */
		}
		
		// Пропускаем строки внутри блочных комментариев
		if (inBlockComment) {
			continue;
		}
		
		// Пропускаем строки с построчными комментариями //
		if (trimmedLine.startsWith('//')) {
			continue;
		}
		
		if (line.includes('<emit:')) {
			const directive = parseEmitDirective(line);
			if (directive && directive.localVar) {
				// Вычисляем первое значение
				let firstValue: string;
				if (!directive.localVarExpr || directive.localVarExpr.trim() === '@current') {
					firstValue = directive.isHex
						? directive.start.toString(16).toUpperCase().padStart(4, '0')
						: directive.start.toString();
				} else {
					const globalVarsObj: Record<string, string> = {};
					variables.forEach((info, name) => {
						globalVarsObj[name] = info.value;
					});
					firstValue =
						executeFunctionCall(directive.localVarExpr, globalVarsObj, directive.start) ||
						directive.localVarExpr;
				}

				const registerLocal = (lineIdx: number) => {
					// Дополнительная проверка: не регистрируем если строка закомментирована
					const targetLine = lines[lineIdx];
					if (!targetLine) return;
					
					const targetTrimmed = targetLine.trim();
					if (targetTrimmed.startsWith('//')) return;
					
					if (!localVariables.has(lineIdx)) localVariables.set(lineIdx, new Map());
					localVariables.get(lineIdx)!.set(directive.localVar!, { value: firstValue, emitLine: i });
				};

				// Помечаем саму строку с emit
				registerLocal(i);

				// Проверяем тело (блок или следующая строка)
				const hasOpenBrace = directive.restOfLine.trim().endsWith('{');
				const nextLine = i + 1 < lines.length ? lines[i + 1] : undefined;
				const nextLineHasBrace = nextLine && nextLine.trim().endsWith('{');

				if (hasOpenBrace || nextLineHasBrace) {
					// Обработка блока {...}
					const baseIndent = line.match(/^(\s*)/)?.[1].length || 0;

					// Если ключ на следующей строке (restOfLine пустой и nextLineHasBrace)
					if (!directive.restOfLine.trim() && nextLineHasBrace) {
						registerLocal(i + 1); // Регистрируем строку с ключом и {
					}

					let j = i + (hasOpenBrace ? 1 : 2); // Если { на след. строке, контент начинается через одну
					while (j < lines.length) {
						const childLine = lines[j];
						const childIndent = childLine.match(/^(\s*)/)?.[1].length || 0;
						const childTrimmed = childLine.trim();
						
						// Если достигли закрывающей скобки на нужном уровне, выходим
						if (childTrimmed === '}' && childIndent <= baseIndent) break;
						
						// Не регистрируем закомментированные строки
						if (!childTrimmed.startsWith('//')) {
							registerLocal(j);
						}
						j++;
					}
				} else if (nextLine && nextLine.trim().length > 0) {
					// Одиночная следующая строка
					registerLocal(i + 1);
				}
			}
		}
	}

	return { variables, localVariables };
}

/**
 * Заменяет Unicode последовательности на символы
 * @param text - Текст с последовательностями \u{...}
 * @returns Текст с замененными символами
 */
export function replaceUnicodeSequences(text: string): string {
	return text.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => {
		try {
			return String.fromCodePoint(parseInt(hex, 16));
		} catch {
			return _;
		}
	});
}

/**
 * Находит самую внутреннюю (ближайшую) локальную переменную
 * @param varName - Имя переменной
 * @param lineLocals - Локальные переменные на строке
 * @returns Информация о переменной или undefined
 */
export function findInnermostLocalVariable(
	varName: string,
	lineLocals: Map<string, LocalVariableInfo> | undefined
): LocalVariableInfo | undefined {
	if (!lineLocals || !lineLocals.has(varName)) {
		return undefined;
	}

	let localVar: LocalVariableInfo | undefined = undefined;
	const entries = Array.from(lineLocals.entries());
	for (const [vName, vInfo] of entries) {
		if (vName === varName) {
			if (!localVar || vInfo.emitLine > localVar.emitLine) {
				localVar = vInfo;
			}
		}
	}

	return localVar;
}
