# Splunk RUM Injector Chrome Extension

Chrome拡張機能を使用して、任意のウェブサイトにSplunk RUM（Real User Monitoring）エージェントを自動的に注入します。

## 📋 概要

この拡張機能は、Splunk Observability CloudのRUM機能を任意のウェブサイトで利用可能にします。開発環境やステージング環境、さらには第三者のウェブサイトでも、パフォーマンス監視とユーザー体験の分析が可能になります。

## ✨ 主な機能

- 🚀 **自動RUM注入** - 任意のHTTPSサイトにSplunk RUMエージェントを自動注入
- 📹 **Session Replay** - ユーザーセッションの記録と再生（v1.0.5以降）
- ⚙️ **柔軟なドメイン制御** - ホワイトリスト/ブラックリスト方式でドメインを管理
- 📊 **リアルタイム統計** - 注入状態とイベント数をリアルタイムで確認
- 🔒 **セキュアなトークン管理** - Chrome拡張機能のセキュアストレージを使用
- 📤 **設定の管理** - 設定のエクスポート/インポート機能
- 🛡️ **CSP対応** - Content Security Policyの制限下でも動作（v1.0.6以降）

## 🌟 最新バージョン: v1.0.8

### 更新履歴
- **v1.0.8** - README整備、Gitリポジトリ初期化
- **v1.0.7** - Session Recorder初期化の改善
- **v1.0.6** - CSPエラーの完全解決
- **v1.0.5** - Session Replay機能の追加
- **v1.0.4** - SplunkRum.init()の自動呼び出し
- **v1.0.3** - CSP対応（ローカルスクリプトバンドル）
- **v1.0.0** - 初期リリース

## 🚀 クイックスタート

### 前提条件
- Google Chrome ブラウザ
- Splunk Observability Cloudのアカウント
- RUM Access Token（Splunk Observabilityで生成）

### インストール手順

#### 1. リポジトリのクローン/ダウンロード
```bash
git clone https://github.com/katzchang/splunk-rum-extension.git
cd splunk-rum-extension
```

#### 2. Chrome拡張機能として読み込み

1. Chromeブラウザを開く
2. `chrome://extensions/` にアクセス
3. 右上の「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. `splunk-rum-extension` フォルダを選択

#### 3. 初期設定

1. **拡張機能アイコンをクリック** → **「Settings」ボタンを選択**
2. **必須項目を入力：**
   - **Realm**: Splunkのrealm（例: `us1`, `us0`, `eu0`）
   - **RUM Access Token**: Splunk ObservabilityのRUMトークン
   
3. **オプション項目を設定：**
   - **Application Name**: アプリケーション名（デフォルト: `monitored-app`）
   - **Environment**: 環境名（デフォルト: `production`）

## ⚙️ 詳細設定

### ドメイン管理

#### ブラックリストモード（デフォルト）
- 指定したドメイン以外のすべてのサイトでRUMを注入
- 除外したいドメインをブラックリストに追加

#### ホワイトリストモード
- 指定したドメインのみでRUMを注入
- 監視したいドメインをホワイトリストに追加

ワイルドカード（`*`）をサポート：
- `*.example.com` - すべてのサブドメインにマッチ
- `example.*` - すべてのTLDにマッチ

## 使い方

1. **有効/無効の切り替え**: ポップアップのトグルスイッチで拡張機能をオン/オフ
2. **現在のページの状態確認**: ポップアップで現在のページでRUMが注入されているか確認
3. **統計情報の確認**: トラッキングされたイベント数と最後のイベント時刻を表示
4. **設定の管理**: オプションページで詳細設定を管理

## 📊 監視項目

### パフォーマンスメトリクス
- **ページロード時間** - FCP、LCP、FID、CLSなどのCore Web Vitals
- **リソースタイミング** - JS、CSS、画像などの読み込み時間
- **ネットワークリクエスト** - XHR/Fetchの詳細とレイテンシ

### エラートラッキング
- **JavaScriptエラー** - 実行時エラーの詳細とスタックトレース
- **未処理のPromise拒否** - async/awaitエラーの捕捉
- **リソース読み込みエラー** - 404エラーやCORSエラー

### ユーザー行動分析
- **クリックイベント** - ユーザーインタラクションの追跡
- **ナビゲーション** - ページ遷移とSPA内のルート変更
- **ページ可視性** - バックグラウンド/フォアグラウンドの切り替え
- **Session Replay** - ユーザーセッションの完全な記録と再生

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### ❌ RUMが注入されない
- **HTTPSサイトか確認** - セキュリティ上、HTTPサイトでは動作しません
- **認証情報の確認** - Realm とAccess Tokenが正しいか確認
- **ドメイン設定** - ホワイトリスト/ブラックリスト設定を確認
- **拡張機能の状態** - ポップアップのトグルがONになっているか確認
- **ページリロード** - 設定変更後は必ずページをリロード

#### ⚠️ CSPエラーが発生する
- v1.0.6以降で対応済みですが、一部の厳格なCSPを持つサイトでは動作しない場合があります
- Consoleで`Content Security Policy`エラーが表示される場合は、そのサイトでの使用を避けてください

#### 📹 Session Replayが記録されない
- Splunk Observability CloudでSession Replay機能が有効になっているか確認
- RUM Access TokenにSession Replayの権限があるか確認
- v1.0.7以降を使用しているか確認

### デバッグ方法

```javascript
// DevTools Consoleでフィルタリング
[Splunk RUM Extension]

// 確認すべきログメッセージ
✅ "Configuration set"           // 設定が正しく読み込まれた
✅ "SplunkRum.init() called"     // RUMが初期化された  
✅ "Session Replay is available"  // Session Replayが利用可能
```

## 設定のバックアップ

オプションページの「Export Config」ボタンで設定をJSONファイルとしてエクスポートできます。
「Import Config」ボタンで設定を復元できます。

## セキュリティ

- Access Tokenは`chrome.storage.local`に安全に保存されます
- HTTPSサイトでのみ動作します
- CSPヘッダーを持つサイトでは動作しない場合があります

## 👩‍💻 開発者向け情報

### プロジェクト構成

```
splunk-rum-extension/
├── manifest.json                          # Chrome拡張機能マニフェスト (v3)
├── popup.html                            # ポップアップUI
├── options.html                          # 設定ページ
├── generate-icons.html                   # アイコン生成ツール
├── src/
│   ├── background.js                     # Service Worker（バックグラウンド処理）
│   ├── content.js                        # コンテンツスクリプト（DOM操作）
│   ├── injector.js                       # RUM初期化スクリプト（ページコンテキスト）
│   ├── splunk-otel-web.js               # Splunk RUMライブラリ（ローカルコピー）
│   ├── splunk-otel-web-session-recorder.js # Session Replayライブラリ
│   ├── popup.js                          # ポップアップのロジック
│   ├── popup.css                         # ポップアップのスタイル
│   ├── options.js                        # 設定ページのロジック
│   └── options.css                       # 設定ページのスタイル
└── assets/
    ├── icon.svg                          # ソースアイコン
    └── icon*.png                         # 各サイズのアイコン（16/32/48/128px）
```

### 技術スタック

- **Chrome Extensions Manifest V3** - 最新の拡張機能API
- **Service Worker** - バックグラウンド処理
- **Content Scripts** - ページへのスクリプト注入
- **Chrome Storage API** - 設定の永続化
- **Splunk O11y RUM SDK** - パフォーマンス監視

### ローカル開発

```bash
# 1. コードを変更
vim src/content.js

# 2. Chrome拡張機能をリロード
# chrome://extensions/ → 更新ボタンをクリック

# 3. テスト対象のページをリロード
# F5 or Cmd+R

# 4. DevTools Consoleでログを確認
# [Splunk RUM Extension] でフィルタリング
```

### Splunk RUMライブラリの更新

```bash
# 最新版をダウンロード
curl -o src/splunk-otel-web.js \
  https://cdn.signalfx.com/o11y-gdi-rum/latest/splunk-otel-web.js

curl -o src/splunk-otel-web-session-recorder.js \
  https://cdn.signalfx.com/o11y-gdi-rum/latest/splunk-otel-web-session-recorder.js

# バージョンを更新
# manifest.json の version を更新
```

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します！

### 開発に参加する

1. このリポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/awesome-feature`）
3. 変更をコミット（`git commit -m 'Add awesome feature'`）
4. ブランチをプッシュ（`git push origin feature/awesome-feature`）
5. プルリクエストを作成

### 報告・要望

- **バグ報告**: GitHubのIssuesでバグを報告
- **機能要望**: 新機能のアイデアを共有
- **質問**: DiscussionsやIssuesで質問

## ⚖️ ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照

## 🙏 謝辞

- [Splunk Observability Cloud](https://www.splunk.com/en_us/products/observability.html) - 素晴らしい監視プラットフォーム
- Chrome Extensions チーム - 拡張機能開発フレームワーク

---

**📧 サポート**: 問題が発生した場合は、GitHubのIssuesで報告してください。