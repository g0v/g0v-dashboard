# g0v dashboard

此專案目的為持續更新關於g0v的各項數據資料
> slack數據來自於ronny的[slack archive](https://g0v-slack-archive.g0v.ronny.tw/)

> 黑客松資訊來自於[g0v database](https://docs.google.com/spreadsheets/d/1C9-g1pvkfqBJbfkjPB0gvfBbBxVlWYJj6tTVwaI5_x8)

---
index.js為後端

> 後端目前放在middle2，一天執行一次 crawler.js 做一次cache

> 獲取全部紀錄的api http://dashboard.g0v.tw/all

> 獲取最新資料的api http://dashboard.g0v.tw/

# 安裝方式
``` bash
npm i
node index.js
```
