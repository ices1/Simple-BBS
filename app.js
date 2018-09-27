
const express = require('express')
const path = require('path')
const port = 3002

const app = express()

// 保存数据
// 保存用户个人信息
const users = [{
  id: 1,
  name: 'foo',
  password: 'foopw'
},{
  id: 2,
  name: 'bar',
  password: 'barpw'
},{
  id: 3,
  name: 'baz',
  password: 'foopw'
},]

// 保存 话题信息
const posts = [{
  id: 1,
  title: 'hello',
  content: 'hello world',
  timestamp: Date.now(),
  userid: 2,
},{
  id: 2,
  title: 'How',
  content: 'How old are you',
  timestamp: Date.now() - 100000,
  userid: 3,
},{
  id: 3,
  title: 'where',
  content: 'where are you from',
  timestamp: Date.now() - 200000,
  userid: 1,
},]


// 美化 html 源代码
app.locals.pretty = true 
// 设置默认模板文件
// app.set('views', './templates')

app.use((req, res, next) => {
  console.log(req.method, req.url)
  next()
})

// 默认打开 static 下的 index.html
// 相对 http://localhost/static 
app.use('./static', express.static('./static'))
// 请求为 / 时， render 响应 index.pug
app.get('/', (req, res, next) => {
  // debugger
  // 威慑么时 {posts} 而不是 posts
  // res.render('index.pug', posts)
  res.render('index.pug', {posts})
})

// 个人帖子
app.get('/post/:userid', (req, res, next)=> {
  // debugger
  let post = posts.find(it => it.id == req.params.userid)
  if (post) {
    res.render('post.pug',{post})
  } else {
    res.status(404).render('post-not-found.pug')
  }
})


app.listen(port, () => {
  console.log('server is listening on port', port)
})





// debugger
/* 
Error 1. 
  Cannot find module 'pug' at...

  solution： 
  根据 package.json 重装 express jade pug
  npm install --save express jade pug


*/