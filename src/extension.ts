/**
 * Главный файл расширения LACON для VSCode
 * Использует модульную архитектуру для декораторов и предпросмотра
 */

import * as vscode from 'vscode';
import * as l10n from '@vscode/l10n';
import { DecoratorManager } from './decorators';
import { PreviewManager } from './preview';

/**
 * ID языка LACON
 */
const LANG_ID = 'lacon';

/**
 * Таймауты для дебаунса обновлений
 */
interface UpdateTimers {
	decorations?: NodeJS.Timeout;
	preview?: NodeJS.Timeout;
}

/**
 * Инициализация локализации
 */
async function initializeLocalization(context: vscode.ExtensionContext): Promise<void> {
	const locale = vscode.env.language;
	const l10nDir = vscode.Uri.joinPath(context.extensionUri, 'l10n');
	let l10nFile = vscode.Uri.joinPath(l10nDir, 'bundle.l10n.json');

	if (locale !== 'en') {
		const specificFile = vscode.Uri.joinPath(l10nDir, `bundle.l10n.${locale}.json`);
		try {
			await vscode.workspace.fs.stat(specificFile);
			l10nFile = specificFile;
		} catch {
			console.log(`Localization for "${locale}" not found, falling back to English.`);
		}
	}

	try {
		await l10n.config({ uri: l10nFile.toString() });
	} catch (e) {
		console.error('Critical error loading l10n:', e);
	}
}

/**
 * Проверяет, является ли документ LACON файлом
 */
function isLaconDocument(document: vscode.TextDocument): boolean {
	return document.languageId === LANG_ID;
}

/**
 * Активация расширения
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
	// Инициализация локализации
	await initializeLocalization(context);

	// Создание менеджеров
	const decoratorManager = new DecoratorManager();
	const previewManager = new PreviewManager();

	// Регистрация провайдера предпросмотра
	previewManager.register(context);

	// Таймеры для дебаунса
	const timers: UpdateTimers = {};

	/**
	 * Триггерит обновление декораторов с дебаунсом
	 */
	function triggerDecorationsUpdate(onlyCursorMove: boolean = false): void {
		const editor = vscode.window.activeTextEditor;
		if (!editor || !isLaconDocument(editor.document)) return;

		if (timers.decorations) {
			clearTimeout(timers.decorations);
		}

		// Оптимизированные задержки:
		// - Движение курсора: 10мс (практически мгновенно)
		// - Изменение текста: 100мс (баланс между отзывчивостью и производительностью)
		const delay = onlyCursorMove ? 10 : 100;

		timers.decorations = setTimeout(() => {
			decoratorManager.updateDecorations(editor, onlyCursorMove);
		}, delay);
	}

	/**
	 * Триггерит обновление предпросмотра с дебаунсом
	 */
	function triggerPreviewUpdate(): void {
		if (timers.preview) {
			clearTimeout(timers.preview);
		}

		// Предпросмотр обновляется быстро (50мс) для хорошей отзывчивости
		timers.preview = setTimeout(() => {
			previewManager.triggerUpdate(0); // Внутри manager'а уже есть свой дебаунс
		}, 50);
	}

	/**
	 * Комплексное обновление декораторов и предпросмотра
	 */
	function triggerUpdate(onlyCursorMove: boolean = false): void {
		triggerDecorationsUpdate(onlyCursorMove);
		if (!onlyCursorMove) {
			triggerPreviewUpdate();
		}
	}

	// Регистрация hover провайдера
	const hoverProvider = vscode.languages.registerHoverProvider(
		{ language: LANG_ID, scheme: 'file' },
		decoratorManager.createHoverProvider()
	);

	// Регистрация команды для переключения предпросмотра JSON
	const toggleJsonCommand = vscode.commands.registerCommand('lacon.toggleJsonPreview', async () => {
		await previewManager.togglePreview();
	});

	// Регистрация обработчиков событий
	context.subscriptions.push(
		hoverProvider,
		toggleJsonCommand,
		decoratorManager,
		previewManager,

		// Изменение активного редактора
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			if (editor && isLaconDocument(editor.document)) {
				triggerUpdate(false);
			}
		}),

		// Изменение текста документа
		vscode.workspace.onDidChangeTextDocument((e) => {
			if (isLaconDocument(e.document)) {
				triggerUpdate(false);
			}
		}),

		// Изменение выделения (движение курсора)
		vscode.window.onDidChangeTextEditorSelection((e) => {
			if (isLaconDocument(e.textEditor.document)) {
				triggerUpdate(true);
			}
		}),

		// Изменение видимых диапазонов (прокрутка)
		vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
			if (isLaconDocument(e.textEditor.document)) {
				triggerUpdate(true);
			}
		})
	);

	// Начальное обновление
	triggerUpdate(false);
}

/**
 * Деактивация расширения
 */
export function deactivate(): void {
	// Очистка выполняется автоматически через subscriptions
}
