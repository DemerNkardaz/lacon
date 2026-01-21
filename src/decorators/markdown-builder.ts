/**
 * Конструктор подсказок Markdown для hover
 */

import * as vscode from 'vscode';

/**
 * Конструктор Markdown подсказок с поддержкой секций
 */
export class MarkdownBuilder {
	private md: vscode.MarkdownString;

	constructor() {
		this.md = new vscode.MarkdownString();
		this.md.isTrusted = true;
		this.md.supportHtml = true;
		this.md.supportThemeIcons = true;
	}

	/**
	 * Добавляет секцию с многострочным содержимым
	 * @param content - Многострочный текст секции
	 * @returns this для цепочки вызовов
	 */
	addSection(content: string): this {
		this.md.appendMarkdown(content);
		return this;
	}

	/**
	 * Добавляет разделитель между секциями
	 * @returns this для цепочки вызовов
	 */
	addSeparator(): this {
		this.md.appendMarkdown('\n\n---\n\n');
		return this;
	}

	/**
	 * Добавляет заголовок
	 * @param level - Уровень заголовка (1-6)
	 * @param text - Текст заголовка
	 * @returns this для цепочки вызовов
	 */
	addHeading(level: number, text: string): this {
		const hashes = '#'.repeat(Math.max(1, Math.min(6, level)));
		this.md.appendMarkdown(`${hashes} ${text}\n\n`);
		return this;
	}

	/**
	 * Добавляет таблицу
	 * @param headers - Заголовки столбцов
	 * @param rows - Массив строк (каждая строка - массив значений)
	 * @returns this для цепочки вызовов
	 */
	addTable(headers: string[], rows: string[][]): this {
		// Заголовки
		this.md.appendMarkdown(`| ${headers.join(' | ')} |\n`);
		// Разделитель
		this.md.appendMarkdown(`| ${headers.map(() => ':---').join(' | ')} |\n`);
		// Строки
		for (const row of rows) {
			this.md.appendMarkdown(`| ${row.join(' | ')} |\n`);
		}
		this.md.appendMarkdown('\n');
		return this;
	}

	/**
	 * Добавляет список
	 * @param items - Элементы списка
	 * @param ordered - Нумерованный список (по умолчанию false)
	 * @returns this для цепочки вызовов
	 */
	addList(items: string[], ordered: boolean = false): this {
		items.forEach((item, index) => {
			const bullet = ordered ? `${index + 1}.` : '-';
			this.md.appendMarkdown(`${bullet} ${item}\n`);
		});
		this.md.appendMarkdown('\n');
		return this;
	}

	/**
	 * Добавляет блок кода
	 * @param code - Код
	 * @param language - Язык для подсветки синтаксиса
	 * @returns this для цепочки вызовов
	 */
	addCodeBlock(code: string, language: string = ''): this {
		this.md.appendMarkdown(`\`\`\`${language}\n${code}\n\`\`\`\n\n`);
		return this;
	}

	/**
	 * Добавляет inline код
	 * @param code - Код
	 * @returns this для цепочки вызовов
	 */
	addInlineCode(code: string): this {
		this.md.appendMarkdown(`\`${code}\``);
		return this;
	}

	/**
	 * Добавляет жирный текст
	 * @param text - Текст
	 * @returns this для цепочки вызовов
	 */
	addBold(text: string): this {
		this.md.appendMarkdown(`**${text}**`);
		return this;
	}

	/**
	 * Добавляет курсивный текст
	 * @param text - Текст
	 * @returns this для цепочки вызовов
	 */
	addItalic(text: string): this {
		this.md.appendMarkdown(`*${text}*`);
		return this;
	}

	/**
	 * Добавляет произвольный текст
	 * @param text - Текст
	 * @returns this для цепочки вызовов
	 */
	addText(text: string): this {
		this.md.appendMarkdown(text);
		return this;
	}

	/**
	 * Добавляет перенос строки
	 * @returns this для цепочки вызовов
	 */
	addNewLine(): this {
		this.md.appendMarkdown('\n');
		return this;
	}

	/**
	 * Возвращает построенный MarkdownString
	 * @returns vscode.MarkdownString
	 */
	build(): vscode.MarkdownString {
		return this.md;
	}
}

/**
 * Создает новый конструктор Markdown
 * @returns MarkdownBuilder
 */
export function createMarkdown(): MarkdownBuilder {
	return new MarkdownBuilder();
}
