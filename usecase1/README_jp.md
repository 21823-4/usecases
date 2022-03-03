# Usecase1: 自動車のプローブデータからFIWAREへの変換

# 概要
このツールは、ISO/IEC 21823-4のユースケース実装です。
このユースケースでは、ISO/IEC 21823-4の仕様に従い、
IoT System 1が利用する自動車のプローブデータ（ISO 22837とISO 14817に準拠）を、IoT System 2が利用するスマートシティFIWAREデータ(https://fiware-datamodels.readthedocs.io/en/latest/howto/index.html)
に変換するためのツールを実装します。
Metamodel1(プローブデータ)とMetamodel2(FIWARE)の間の情報交換ルールを介して、Metamodel1に準拠するModel1を、Metamodel2に準拠するModel2に自動変換します。

# インストール
## 前提
Open JDK (Java Development Kit) 11 とGradleのインストールが必要です。
Windowsの場合、https://adoptium.net/index.html?variant=openjdk11 および https://gradle.org/ からダウンロードできます。
以下の環境での動作が確認されています。
- Windows 10
- Eclipse Termurin JDK with Hotspot 11.0.13+8 (x64)
- Gradle 5.4

## ダウンロード
https://github.com/21823-4/usecases から、「Code」をクリックし、画面右上の「Download ZIP」からファイルをダウンロードしてください。
Gitがインストールされている場合は、次のコマンドでcloneを使用してダウンロードすることもできます。
```
git clone https://github.com/21823-4/usecases.git
```

## 依存モジュールのインストールとビルド
下記のコマンドを iso-iec-21823-4\usecase1 のディレクトリで実行してください。
```
gradle build
```


成功すると、次のようなメッセージが表示されます:<br>
BUILD SUCCESSFUL in (xxx) s

ビルド後に「build」ディレクトリが生成され、「build」ディレクトリに「libs」ディレクトリが生成されていること、
「jp.co.toshiba.rdc.modelconverter.jar」が「build/libs」ディレクトリに生成されていることを確認します。

# 実行方法
```
java -jar .\build\libs\jp.co.toshiba.rdc.modelconverter.jar
```

上記のコマンドでプログラムを実行すると、outFIWARE.jsonとProbe2FIWARE.asmの2つの出力ファイルが「usecase1」ディレクトリの下に生成されます。

# ソースツリー

```
usecase1
├─input_data
│   ├─Fiware.ecore                // ecore形式のFIWAREメタモデル(metamodel2)
│   ├─M-Vehicle.xmi               // xml形式のISO 22837/ISO 14817プローブデータ(model1)
│   ├─ProbeVehicle.ecore          // ecore形式のISO 22837/ISO 14817プローブデータのメタモデル(metamodel1)
│   └─Probe2Fiware.atl            // ATL形式の変換ルール
├─output_data
│   ├─outFIWARE.json              // JSON形式のFIWAREデータ(model2)
│   └─Probe2FIWARE.asm            // 一時ファイル
└─src/main/java/jp/co/toshiba/rdc/modelconverter
    ├─core
    │  └─AtlLauncherService.java    // ATL変換サービス
    ├─extractor
    │  └─JsonExtractor.java         // JSON形式Extractor
    └─main
        └─Probe2Fiware.java          // メインの関数

```
