
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const port = 3002

const app = express()

// 保存数据
// 保存用户个人信息
const users = [{
  id: 1,
  name: 'user001',
  password: 'foopw'
},{
  id: 2,
  name: 'user002',
  password: 'barpw'
},{
  id: 3,
  name: 'user003',
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

// 保存 评论
const comments = [{
  id: 1,
  postid: 3,
  userid: 1,
  content: '第 1 条评论',
  timestamp: Date.now() - 56788
}, {
  id: 2,
  postid: 2,
  userid: 2,
  content: '第 2 条评论',
  timestamp: Date.now() - 56788
}, {
  id: 3,
  postid: 1,
  userid: 1,
  content: '第 3 条评论',
  timestamp: Date.now() - 56788
}, {
  id: 4,
  postid: 2,
  userid: 3,
  content: '第 4 条评论',
  timestamp: Date.now() - 56788
}, ]
// 美化 html 源代码
app.locals.pretty = true 
// 设置默认模板文件
// app.set('views', './templates')


// 默认打开 static 下的 index.html
// 相对 http://localhost/static 
app.use('/static', express.static('./static'))
app.use(bodyParser.urlencoded())

app.get('/', (req, res, next) => {
  res.render('index.pug', {posts})
})

// 帖子详情
app.get('/post/:postid', (req, res, next)=> {
  // debugger
  let postid = req.params.postid
  let post = posts.find(it => it.id == postid)
  let comment = comments.filter(it => it.postid == postid)
  if (post) {
    res.render('post.pug',{post,comment})
  } else {
    res.status(404).render('page-404.pug')
  }
})

// 回复帖子
app.post('/add-comment', (req, res, next) => {
  console.log(req.body)
  comments.push({
    id: comments[comments.length - 1].id + 1,
    userid: 2 ,
    postid: req.body.postid,
    content: req.body.content,
    timestamp: Date.now()
  })
  res.redirect('/post/' + req.body.postid)
})

app.listen(port, () => {
  console.log('server is listening on port', port)
})

// 个人主页
app.get('/user/:userid', (req, res, next) => {
  let userid = req.params.userid
  let user = users.find(it => it.id == userid)
  let userPosts = posts.filter(it => it.userid == userid)

  res.render('user.pug', {
    user, 
    posts: userPosts
  })
})





// debugger
/* 
Error 1. 
  Cannot find module 'pug' at...

  solution： 
  根据 package.json 重装 express jade pug
  npm install --save express jade pug


*/