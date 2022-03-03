# Usecase2: IEC CDDからAASへのデータ変換

# 概要
このツールはISO/IEC 21823-4のユースケース実装です。
このユースケースでは、ISO/IEC 21823-4に準拠した方法で、
IoT System1が利用するIEC 61987 CDDを、IoT System2が利用するAASに変換するモジュール（CDD_2_AAS）を実装します。
Metamodel1 (IEC CDD)とMetamodel2 (AAS) の間の情報交換ルールを介して、Metamode1に準拠するModel1 (IEC 61987 CDD) を、Metamodel2に準拠するModel2に自動変換します。

# インストール
## 前提
nodejsとnpmのインストールが必要です。
Windowsの場合、https://nodejs.org/ からダウンロードできます。
以下の環境での動作が確認されています。
- Windows 10
- nodejs 4.1.6
- npm 6.13.4

## ダウンロード
https://github.com/21823-4/usecases から「Code」をクリックし、画面右上の「Download ZIP」からファイルをダウンロードしてください。
Gitがインストールされている場合は、次のコマンドでcloneを使用してダウンロードすることもできます。

```
git clone https://github.com/21823-4/usecases.git
```

## 依存モジュールのインストール
下記のコマンドを iso-iec-21823-4\usecase2 のディレクトリで実行してください。

```
npm ci
```

成功すると、次のようなメッセージが表示されます:

```
added (xxx) packages in (yyy) s
```

## ビルド
下記のコマンドを iso-iec-21823-4\usecase2 のディレクトリで実行してください。

```
npm run build
```

成功すると、次のようなメッセージが表示されます:
```
webpack 5.44.0 compiled successfully in (xxx) ms
```

ビルド後に「dist」ディレクトリが生成され、「dist」ディレクトリに「index.html」が生成されていることを確認します。


# 実行方法
## デモの実行
下記のコマンドを iso-iec-21823-4\usecase2 のディレクトリで実行してください。

```
npx serve ./dist
```
次のようなメッセージが表示されます。.

```
   ┌────────────────────────────────────────────────────┐
   │                                                    │
   │   Serving!                                         │
   │                                                    │
   │   - Local:            http://localhost:3000        │
   │   - On Your Network:  http://(PC IP Address):3000  │
   │                                                    │
   │   Copied local address to clipboard!               │
   │                                                    │
   └────────────────────────────────────────────────────┘
```

ブラウザで表示されたアドレス(この場合、http://localhost:3000 )を開くと、
次のような画面が表示されます。

<img src="./usecase2/img/image.png" alt="usecase2" width="500"/>



|     | 名称                | 説明                                           |
| --- | ------------------- | ---------------------------------------------- |
| (1)   | CDD メタモデル      | IEC CDD メタモデルファイル             |
| (2)   | IEC CDD（class）    | IEC CDD（class）ファイル           |
| (3)   | IEC CDD（property） | IEC CDD（property）ファイル        |
| (4)   | AAS メタモデル      | AAS メタモデルファイル             |
| (5)   | 変換ルール          | 変換ルールファイル                 |
| (6)   | 変換ボタン          | データ変換処理を実行                     |
| (7)   | ダウンロードボタン  | 作成された変換結果（JSON）をダウンロード |
| (8)   | メッセージ表示領域  | メッセージ表示                       |
| (9)   | 変換結果表示領域    | データ変換結果をツリー形式で表示         |


### 操作方法

1. (6)変換ボタンにて、入力ファイルからの情報を元に変換を実施する。
    - 変換に成功した場合は、その結果が (9)変換結果表示領域に表示され、(7)ダウンロードボタンが有効となる。
    - 変換に失敗した場合は、エラー内容が (8)メッセージ表示領域に表示される。この場合、(7)ダウンロードボタンは有効とならない。
2. 変換に成功した場合は、(7)ダウンロードボタンにて、変換結果の JSON ファイルをダウンロードできる。

## 変換ファイルの設定
### config.json (dist/config.json)
設定ファイル「config.json」で、変換に必要な入力ファイルのパスを設定できます。
プロジェクトのビルド後、この「config.json」は「dist」のディレクトリの下に生成されます。
「config.json」には下記のキーがあります。
設定する各ファイルのパスは、このconfig.jsonからの相対パスによって指定されます。


| key name      | content                                | summary                               |
| ------------- | ---------------------------------------|----------------------------           |
| File1         | IEC CDD メタモデルのファイルパス            | IEC CDD メタモデルの例       |
| File2class    | IEC CDD（class）のファイルパス               | IEC CDD モデル(クラス)         | 
| File2property | IEC CDD（property）のファイルパス           | IEC CDD モデル(プロパティ)      |
| File3         | AAS メタモデルのファイルパス                 | AAS メタモデル |
| File4         | 変換ルール定義のファイルパス   | 変換ルールの定義          | 
| Template      | テンプレートのファイルパス                     | AAS用テンプレート |


### Config.jsonの例

```
{
    "File1": "data/File1_IEC61360.xsd",
    "File2class": "data/File2_IEC61987_class.csv",
    "File2property": "data/File2_IEC61987_property.csv",
    "File3": "data/File3_AAS_MM.json",
    "File4": "data/File4_AAS_CDD_MappingRules.csv",
    "Template": "data/File5_template.json"
}
```

# ソースツリー

```
usecase2
├─img
│   ├─image.png
│   └─image2.png
│
├─src
│  ├─convert_engine
│  │   ├─cddconvert.ts       // 変換エンジンメイン関数
│  │   ├─AASMetamodel.ts     // AAS メタモデルの処理関数
│  │   ├─ConvertRules.ts     // 情報変換ルールの処理関数
│  │   ├─IecCddClass.ts      // IEC CDD CLASS(IecCddClass)/IEC CDD Property(IecCddProp)の処理関数
│  │   ├─ResultRetention.ts  // 結果クラスの処理関数
│  │   ├─const.ts            // 文字列定数定義などの処理関数
│  │   ├─messages.ts         // コンソールメッセージの定義
│  │   └─util.ts             // ユーティリティ関数
│  │
│  └─web_form
│       ├─config.json         // 入力ファイルを設定するJSONファイル
│       ├─index.html          // Web UI
│       ├─index.ts            // Web UI用スクリプト
│       └─styles.css          // Web UI用スタイルシート
│
├─input_data                // Web UI用入力データ
└─output_data               // デフォルト入力データを使った時の出力データ

```
