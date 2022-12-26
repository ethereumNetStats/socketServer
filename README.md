# socketServerについて
socketServerは、主に以下の動作をします。
- 各データレコーダーから発行されるソケットイベントの中継
- 各データレコーダーによる集計データのデータプールへの送信
- データプールサーバーから発行されるイベントに応じてMySQLデータベースからデータを取得して応答する  

なお、socketServerは、MySQLとの通信には[Node MySQL 2](https://github.com/sidorares/node-mysql2#readme)を使用し、その他の通信には[sokcet.io](https://socket.io/)を使用しています。

# 事前準備
事前に以下のことを完了して下さい。
- [blockDataRecorder](https://github.com/ethereumNetStats/blockDataRecorder)のDockerのインストール〜ソースコードの実行
- [minutelyBasicNetStatsRecorder](https://github.com/ethereumNetStats/minutelyBasicNetStatsRecorder)の実行
- [hourlyBasicNetStatsRecorder](https://github.com/ethereumNetStats/hourlyBasicNetStatsRecorder)の実行
- [dailyBasicNetStatsRecorder](https://github.com/ethereumNetStats/dailyBasicNetStatsRecorder)の実行
- [weeklyBasicNetStatsRecorder](https://github.com/ethereumNetStats/weeklyBasicNetStatsRecorder)の実行

## ソースコード
ソースコードを確認したい場合は、以下のソースコードを確認して下さい。
- メイン：[socketServer.ts](https://github.com/ethereumNetStats/socketServer)

## 使い方
以下では、ubuntu server v22.04での使用例を説明します。  
まずこのレポジトリを`clone`します。
```shell
git clone https://github.com/ethereumNetStats/socketServer.git
```
`clone`が終わったら以下のコマンドでクローンしたディレクトリに移動して下さい。
```shell
cd ./socketServer
```
ディレクトリ内にある`.envSample`ファイルの`MYSQL_USER`と`MYSQL_PASS`を編集します。  
[blockDataRecorder](https://github.com/ethereumNetStats/blockDataRecorder)の手順通りにMySQLコンテナを立ち上げた場合は`MYSQL_USER=root`、`MYSQL_PASS`は起動時に指定したパスワードになります。  
`.envSample`
```
DATA_POOL_SERVER=ws://127.0.0.1:2226

MYSQL_LAN_ADDRESS=127.0.0.1
MYSQL_PORT=3308
MYSQL_USER=*****
MYSQL_PASS=*****
```
`.envSample`の編集が終わったらファイル名を`.env`にリネームして下さい。
```shell
mv ./.envSample ./.env 
```
`.env`の編集が終わったら関連パッケージのインストールをします。
```shell
npm install
```
関連パッケージのインストールが終わったらTypescriptソースを下記コマンドでコンパイルします。
```shell
tsc --project tsconfig.json
```
コンパイルが終わったらDockerイメージをビルドしてコンテナを起動するためにシェルスクリプト`buildAndRunDockerImage.sh`に実行権限を付与します。
```shell
chmod 755 ./buildAndRunDockerImage.sh
```
最後にシェルスクリプトを実行してDockerコンテナを起動します。
```shell
sudo ./buildAndRunDockerImage.sh
```
## socketServerが扱うイベント
### 中継イベント
| 中継元                           | 中継イベント                        | 中継先                                                                                                                          |
|-------------------------------|-------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| blockDataRecorder             | newBlockDataRecorded          | minutelyBasicNetStatsRecorder<br/>hourlyBasicNetStatsRecorder<br/>dailyBasicNetStatsRecorder<br/>weeklyBasicNetStatsRecorder |
| minutelyBasicNetStatsRecorder | minutelyBasicNetStatsRecorded | dataPoolServer                                                                                                               |
| hourlyBasicNetStatsRecorder   | hourlyBasicNetStatsRecorded   | dataPoolServer                                                                                                               |
| dailyBasicNetStatsRecorder    | dailyBasicNetStatsRecorded    | dataPoolServer                                                                                                               |
| weeklyBasicNetStatsRecorder   | weeklyBasicNetStatsRecorded   | dataPoolServer                                                                                                               |  

### 要求イベント
| 要求イベント                             | 要求元            | 応答イベント                             |
|------------------------------------|----------------|------------------------------------|
| requestInitialMinutelyNetStats     | dataPoolServer | initialMinutelyNetStats            |
| requestInitialHourlyNetStats       | dataPoolServer | initialHourlyNetStats              |
| requestInitialDailyNetStats        | dataPoolServer | initialDailyNetStats               |
| requestInitialWeeklyNetStats       | dataPoolServer | initialWeeklyNetStats              |
| requestInitialBlockData            | dataPoolServer | initialBlockData                   |
| requestBlockDetail                 | dataPoolServer | responseBlockDetail                |
| requestBlockList                   | dataPoolServer | responseBlockList                  |
| requestBlockListPageByBlockNumber  | dataPoolServer | requestBlockListPageByBlockNumber  |
