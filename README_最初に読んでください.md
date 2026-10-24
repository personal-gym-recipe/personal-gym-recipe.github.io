# Personal gym Recipe — GitHub Pages版

現在の公開先は次のGitHub Pagesです。

https://personal-gym-recipe.github.io/

## 現在できること

- パソコン用メニューと、スマホ用の右側メニュー
- トレーナー紹介、店内ギャラリー、指導の流れ、料金、アクセス、Q&A
- 公式LINEからの初回体験・ご相談受付と、Instagramへのリンク
- `/admin/` からGitHub専用キーでギャラリー画像を差し替え・並べ替え
- 公開用画像の自動軽量化と、ギャラリーの自動更新

## 公開用ファイルを作る

Node.jsが入っている環境で、プロジェクトフォルダ内から実行します。

```bash
npm run build
```

公開用ファイルは `docs` に作成されます。GitHub Pagesの公開元は、`main` ブランチの `/docs` に設定します。

## ギャラリーを更新する

詳しい手順は `管理画面の使い方.md` を参照してください。GitHub専用キーはブラウザーを閉じるまでの一時領域だけに保存され、サイトやGitHubのファイルには保存されません。

## お問い合わせ

初回体験の予約・相談は公式LINE、ジムの雰囲気確認はInstagramへ案内します。メールフォームや外部フォーム送信サービスは使用しません。

## Q&Aを追加する

`サイト内容の更新方法.md` を参照してください。未確認の経路は、公開ページには表示しない構成です。

## 主なファイル

- `src/data/site.json`：プロフィール、料金、住所、Q&Aなど
- `src/assets/gallery/`：ギャラリー画像6枚
- `src/admin/`：ギャラリー管理画面
- `src/assets/`：画像、CSS、JavaScript
- `build.mjs`：`docs` を生成する処理
- `docs/`：GitHub Pages公開用ファイル
