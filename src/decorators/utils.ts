/**
 * Вспомогательные функции для декораторов
 */

import { EmbeddedRange } from './types';

/**
 * Извлекает диапазоны встроенных языков из текста
 * @param text - Текст документа
 * @returns Массив диапазонов встроенных языков
 */
export function getEmbeddedLanguageRanges(text: string): EmbeddedRange[] {
	const ranges: EmbeddedRange[] = [];
	const embeddedRegex =
		/\/\*\*\s*(json|javascript|js|typescript|ts|python|py|css|html|xml|yaml|yml|sql|markdown|md|regex|regexp|shell|bash|sh)\s*\n([\s\S]*?)\*\//gi;
	let match;
	while ((match = embeddedRegex.exec(text)) !== null) {
		ranges.push({ start: match.index, end: match.index + match[0].length });
	}
	return ranges;
}

/**
 * Проверяет, находится ли позиция внутри встроенного языка
 * @param position - Позиция в тексте
 * @param ranges - Массив диапазонов встроенных языков
 * @returns true если позиция внутри встроенного языка
 */
export function isInEmbeddedLanguage(position: number, ranges: EmbeddedRange[]): boolean {
	return ranges.some((range) => position >= range.start && position < range.end);
}
