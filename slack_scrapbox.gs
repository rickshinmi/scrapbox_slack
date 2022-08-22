//** ユーザー単位でリアクションリストを取得 */
//** https://api.slack.com/methods/reactions.list */
function getReactionList(user,limit){

  url = "https://slack.com/api/reactions.list" //基本のURL
  
  const arguments = {
    "user": user, //ユーザーID
    "limit": limit,　//取得制限数
    }

  const options = {
    "headers": { 'Authorization': 'Bearer ' + 'アクセストークンを入れてね！' }, // headers に取得したトークンを入れる
    "method" : "GET",
    "payload" : arguments
    };
    
  return UrlFetchApp.fetch(url,options); //Slackへリクエストを送信

}

const projectName = "scrapboxのプロジェクト名を入れてね！"

//** 現在 - 引数period_daysを引いた、UNIXタイムスタンプを取得  */
function getOldestTimeStamp(period_days){

  const period = period_days;  
  const d = new Date();
  d.setDate(d.getDate() - period); //現在から**日前の日時を取得
  const oldest = d.getTime()/1000; //ミリ秒⇒秒に変換

  return oldest;
}




// 日付をYYYY-MM-DDの書式で返すメソッド
function formatDate(dt) {
  const y = dt.getFullYear();
  const m = ('00' + (dt.getMonth()+1)).slice(-2);
  const d = ('00' + dt.getDate()).slice(-2);
  return (y + '-' + m + '-' + d);
}



//** スタンプ[dart]を付けた投稿を取得する */
function getSlackLog(){

  const log_list = []
  const oldest = getOldestTimeStamp(1); // 現在から１日前までのタイムスタンプを取得

  for (let menber of Object.keys(menbers)){  //　メンバー単位でループ　今回の例では１人

    const rec_list_json = getReactionList(menbers[menber] ,"100");　// メンバーがスタンプ（emoji）を押した投稿を全て取得する（JSONデータ）
    const rec_list = JSON.parse(rec_list_json);

    for (let item=0;  item < rec_list.items.length; item++){     //投稿の数でforループする

      const reac_name = rec_list.items[item].message.reactions[0].name;             // スタンプ（emoji）名を取得      
      const reac_user = rec_list.items[item].message.reactions[0].users[0];         // スタンプ（emoji）を押したユーザーIDを取得
      const ts = rec_list.items[item].message.ts;                                   // 投稿のタイムスタンプ（文字列型）を取得 
      const timestanp = Number(ts);                                                 // タイムスタンプを数値に変換


      if(reac_name == "scrapbox" && reac_user == menbers[menber]  && timestanp >= oldest ){  // emojiが[dart]　&& スタンプ押下Userと一致 && **日前までの投稿を抽出
        
        const permalink = rec_list.items[item].message.permalink;   // 投稿のパーマリンクを取得
        const text = rec_list.items[item].message.text;             // 冒頭メッセージを取得  
        
        const d =  Number(ts * 1000) ;　// tsを文字列⇒数値に変換、単位を秒からミリ秒に変換
        const message_date = formatDate(new Date(d)); // フォーマットをYYYY-MM-DDに変換
        const title = text.slice( 0, 15 ) ;
        const channel = rec_list.items[item].channel;
        const link = `https://scrapbox.io/${encodeURIComponent(projectName)}/${encodeURIComponent(title)}?body=${encodeURIComponent(text)}[${encodeURIComponent(channel)}]`;

        const log_row = [message_date, text, permalink, link];　// スプレッドシート用Rowデータを配列化
        log_list.push(log_row); // スプレッドシート用RangeデータにRowデータを追加（２次元配列）
        }
      } 
    }
  return log_list;
}


//**スプレッドシートへ2次元配列を、空いてる行から追加する関数　引数：（データ配列、スプレッドシートのシート名、スプレッドシートの開始列） */
function addRangeValues(range_values, sheet_name, start_colum){

  if (range_values.length === 0 ){ // データ配列が空の場合は処理を抜ける
    return;
  
  }else{

    const sheet = SpreadsheetApp.getActive().getSheetByName(sheet_name);　　//スプレッドシートを選択

    const start_row = sheet.getDataRange().getLastRow() + 1;　// データがある最終行に１を足し、データ追加する最初の行を定義する
    　
    const lastColum = range_values[0].length;   // データ配列の列数を取得
    const lastRow = range_values.length;        // データ配列の行数を取得

    const terget = sheet.getRange(start_row,start_colum,lastRow,lastColum);　// 書き込み先のセル範囲を取得
    terget.setValues(range_values);　 // セル範囲にデータをセットする
    }
  }

function removeDuplicates() {
  var ss = SpreadsheetApp.getActive().getSheetByName("Slack_log");
  var range = ss.getDataRange();
  // 列Bに重複する値がある行を削除
  range.removeDuplicates([2]);
}


//** 最初に実行する関数 */
function main(){
    const slack_log = getSlackLog();              // Slack投稿の２次元配列データを作成する関数を呼び出す
    addRangeValues(slack_log, "Slack_log", 1);    // スプレッドシートにデータを追加する関数を呼び出す
    removeDuplicates();
}