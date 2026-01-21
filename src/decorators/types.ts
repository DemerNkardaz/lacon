/**
 * Типы и интерфейсы для декораторов LACON
 */

import * as vscode from 'vscode';

/**
 * Информация о глобальной переменной
 */
export interface VariableInfo {
	value: string;
	line: number;
	doc?: string;
}

/**
 * Информация о локальной переменной emit
 */
export interface LocalVariableInfo {
	value: string;
	emitLine: number;
}

/**
 * Хранилище переменных
 */
export interface VariableStorage {
	variables: Map<string, VariableInfo>;
	localVariables: Map<number, Map<string, LocalVariableInfo>>;
}

/**
 * Настройки стиля декоратора
 */
export interface DecoratorStyle {
	contentText: string;
	color: string;
	fontStyle?: 'normal' | 'italic' | 'oblique';
	backgroundColor?: string;
	border?: string;
	textDecoration?: string;
	margin?: string;
}

/**
 * Контекст декоратора
 */
export interface DecoratorContext {
	editor: vscode.TextEditor;
	variables: VariableStorage;
	embeddedRanges: Array<{ start: number; end: number }>;
}

/**
 * Диапазон встроенного языка
 */
export interface EmbeddedRange {
	start: number;
	end: number;
}
