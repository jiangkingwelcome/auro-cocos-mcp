declare namespace Editor {
  namespace Package {
    function register(pkgPath: string): Promise<void>;
    function unregister(pkgPath: string): Promise<void>;
  }

  namespace Dialog {
    interface ShowOptions {
      type?:      'none' | 'info' | 'error' | 'question' | 'warning';
      title?:     string;
      message:    string;
      detail?:    string;
      buttons?:   string[];
      defaultId?: number;
      cancelId?:  number;
    }
    /** Cocos Creator 3.x 原生对话框，返回用户点击的按钮索引 */
    function show(options: ShowOptions): Promise<{ response: number }>;
  }

  namespace App {
    const version: string;
    const path: string;
  }

  namespace Project {
    const path: string;
    const name: string;
  }

  namespace Profile {
    function getConfig(scope: string, key: string): Promise<unknown>;
    function setConfig(scope: string, key: string, value: unknown): Promise<void>;
  }

  namespace Message {
    function send(extensionName: string, message: string, ...args: unknown[]): void;
    function request(extensionName: string, message: string, ...args: unknown[]): Promise<unknown>;
    function addBroadcastListener(event: string, handler: (...args: unknown[]) => void): void;
    function removeBroadcastListener(event: string, handler: (...args: unknown[]) => void): void;
  }

  namespace Panel {
    function open(panelName: string): void;
    function define(options: PanelDefineOptions): unknown;
  }

  namespace Selection {
    function getSelected(type: string): string[];
    function select(type: string, uuids: string[]): void;
    function clear(type: string): void;
  }

  interface PanelDefineOptions {
    template: string;
    style?: string;
    $?: Record<string, string>;
    ready?(): void;
    close?(): void;
    methods?: Record<string, (...args: unknown[]) => unknown>;
    update?(...args: unknown[]): void;
  }
}
