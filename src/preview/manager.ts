/**
 * Менеджер предпросмотра JSON для LACON
 */

import * as vscode from 'vscode';
import { LaconJsonProvider } from './preview-provider';

/**
 * Менеджер предпросмотра
 */
export class PreviewManager {
	private provider: LaconJsonProvider;
	private updateTimeout: NodeJS.Timeout | undefined = undefined;

	constructor() {
		this.provider = new LaconJsonProvider();
	}

	/**
	 * Регистрирует провайдер в контексте расширения
	 * @param context - Контекст расширения
	 */
	register(context: vscode.ExtensionContext): void {
		context.subscriptions.push(
			vscode.workspace.registerTextDocumentContentProvider(LaconJsonProvider.scheme, this.provider)
		);
	}

	/**
	 * Получает URI виртуального документа для предпросмотра
	 * @param laconUri - URI LACON документа
	 * @returns URI виртуального JSON документа
	 */
	getVirtualUri(laconUri: vscode.Uri): vscode.Uri {
		return vscode.Uri.parse(
			`${LaconJsonProvider.scheme}:Preview.json?${encodeURIComponent(laconUri.toString())}`
		);
	}

	/**
	 * Триггерит обновление предпросмотра с дебаунсом
	 * @param delay - Задержка в миллисекундах (по умолчанию 50мс)
	 */
	triggerUpdate(delay: number = 50): void {
		if (this.updateTimeout) {
			clearTimeout(this.updateTimeout);
		}

		this.updateTimeout = setTimeout(() => {
			vscode.workspace.textDocuments.forEach((doc) => {
				if (doc.uri.scheme === LaconJsonProvider.scheme) {
					this.provider.update(doc.uri);
				}
			});
		}, delay);
	}

	/**
	 * Открывает предпросмотр JSON для активного LACON документа
	 */
	async togglePreview(): Promise<void> {
		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.document.languageId !== 'lacon') {
			return;
		}

		const virtualUri = this.getVirtualUri(editor.document.uri);
		const doc = await vscode.workspace.openTextDocument(virtualUri);
		await vscode.window.showTextDocument(doc, {
			viewColumn: vscode.ViewColumn.Beside,
			preserveFocus: true,
			preview: true,
		});
	}

	/**
	 * Освобождает ресурсы
	 */
	dispose(): void {
		if (this.updateTimeout) {
			clearTimeout(this.updateTimeout);
		}
	}
}
