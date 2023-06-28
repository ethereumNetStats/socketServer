# socketServerについて
socketServerは、主に以下の動作をします。
- 各データレコーダーから発行されるソケットイベントの中継
- 各データレコーダーによる集計データのデータプールへの送信
- データプールサーバーから発行されるイベントに応じてデータベースからデータを取得して応答する

# ソースコード
ソースコードを確認したい場合は、以下のソースコードを確認して下さい。
- [メイン](https://github.com/ethereumNetStats/socketServer/blob/main/socketServer.ts)
- [各関数](https://github.com/ethereumNetStats/socketServer/blob/main/functions)