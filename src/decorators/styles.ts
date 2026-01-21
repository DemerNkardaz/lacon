/**
 * Универсальные функции для создания стилей декораторов
 */

import * as vscode from 'vscode';
import { DecoratorStyle } from './types';

/**
 * Базовые стили декоратора (по умолчанию)
 */
const BASE_STYLE: Partial<DecoratorStyle> = {
	textDecoration: 'none; font-family: sans-serif; display: inline-block; text-align: center; border-radius: 3px; padding: 0 0.9em; line-height: 1.135em; vertical-align: middle;',
	margin: '0 2px',
};

/**
 * Создает объект стиля декоратора с возможностью переопределения свойств
 * @param overrides - Объект с переопределяемыми свойствами стиля
 * @returns Полный объект стиля для декоратора
 */
export function createDecoratorStyle(overrides: Partial<DecoratorStyle>): DecoratorStyle {
	const style: DecoratorStyle = {
		contentText: overrides.contentText || '',
		color: overrides.color || '#ffffff',
		textDecoration: overrides.textDecoration ?? BASE_STYLE.textDecoration,
		margin: overrides.margin ?? BASE_STYLE.margin,
	};

	// Добавляем fontStyle только если он задан явно
	if (overrides.fontStyle !== undefined) {
		style.fontStyle = overrides.fontStyle;
	}

	// Добавляем backgroundColor и border только если они заданы
	if (overrides.backgroundColor) {
		style.backgroundColor = overrides.backgroundColor;
	}
	if (overrides.border) {
		style.border = overrides.border;
	}

	return style;
}

/**
 * Создает опции декоратора для VSCode
 * @param range - Диапазон текста для декорирования
 * @param style - Стиль декоратора
 * @returns Опции декоратора VSCode
 */
export function createDecorationOptions(
	range: vscode.Range,
	style: DecoratorStyle
): vscode.DecorationOptions {
	return {
		range,
		renderOptions: {
			after: style,
		},
	};
}

/**
 * Предустановленные цветовые схемы для разных типов декораторов
 */
export const COLOR_SCHEMES = {
	emit: {
		color: '#ff57f4',
		backgroundColor: 'rgba(255, 87, 244, 0.15)',
		border: '1px solid #ff57f4',
	},
	function: {
		color: '#ff57a3',
		backgroundColor: 'rgba(255, 106, 153, 0.15)',
		border: '1px solid #ff57a3',
	},
	unicode: {
		color: '#eae059',
		backgroundColor: 'rgba(234, 224, 89, 0.15)',
		border: '1px solid #eae059',
	},
	globalVar: {
		color: '#6a9fff',
		backgroundColor: 'rgba(89, 147, 234, 0.15)',
		border: '1px solid #6a9fff',
	},
	localVar: {
		color: '#ff57f4',
		backgroundColor: 'rgba(255, 87, 244, 0.15)',
		border: '1px solid #ff57f4',
	},
} as const;
