
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const sqlite = require('sqlite')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const dbPromise = sqlite.open('./bbs.db', { Promise });
const upload = multer({dest: path.join(__dirname, 'user-uploaded')})
const port = 3002
const app = express()
let db

// 美化 html 源代码
app.locals.pretty = true 
// 设置默认模板文件
// app.set('views', './views')

// 默认打开 static 下的 index.html
// 相对 http://localhost/static 
app.use('/static', express.static('./static'))
app.use('/avatars', express.static('./user-uploaded'))
app.use(cookieParser('sdfghyhbvbnm'))
app.use(bodyParser.urlencoded())

// 主页
app.get('/', async (req, res, next) => {
  let posts = await db.all('SELECT posts.*, username, avatar FROM posts JOIN users WHERE posts.userId = users.id')
  res.render('index.pug', {posts})
})

// 帖子详情
app.get('/post/:postid', async (req, res, next)=> {

  let postid = req.params.postid
  let post = await db.get(
    'SELECT posts.*, username, avatar FROM posts JOIN users ON posts.userId = users.id WHERE posts.id = ?'
    , postid)

  if (post) {
    let comments = await db.all(
      `SELECT username, avatar, com.* FROM users join 
      (SELECT c.userId, c.content, c.timestamp FROM posts JOIN comments c ON posts.id = c.postId WHERE posts.id = ? ) com 
      where userId = id`
      , postid)

    res.render('post.pug',{post,comments})
  } else {
    res.status(404).render('page-404.pug')
  }
})

// 回复帖子
app.post('/add-comment', async (req, res, next) => {
  let userId = req.signedCookies.userId

  if (userId) {
    await db.run(
    'INSERT INTO comments (postId, userId, content, timestamp) VALUES (?,?,?,?)',
    req.body.postid, userId, req.body.content, Date.now())

    res.redirect('/post/' + req.body.postid)
  } else {
    res.send('you are not logged in, cant not allow commit!')
  }
})


// 个人主页
app.get('/user/:userid', async (req, res, next) => {
  let userid = req.params.userid

  let posts = await db.all(
    'SELECT u.username, p.* from users u join posts p on u.id = p.userId where u.id = ?'
    , userid)  
  let user = await db.get(
    'SELECT users.id, users.username FROM users where id = ?'
    , userid
  )
  let comments = await db.all(
    `SELECT title postTitle, com.* from posts join 
    (SELECT u.username, c.* from users u join comments c on u.id = c.userId where u.id = ?) com 
    where com.postId = posts.id`
    // 'SELECT u.username, c.* from users u join comments c on u.id = c.userId where u.id = ?'
    , userid
  )
    
  res.render('user.pug', {
     user,
     posts,
     comments
    })
})

// 注册
app.route('/register')
  .get((req, res, next) => {
    res.render('register.pug')
    // res.sendfile(path.join(__dirname, './static/register.html'))
  })
  .post(upload.single('avatar'), async (req, res, next) => {
    console.log(req.file)
    console.log(req.body)

    let isExistUser = await db.get( 
      'SELECT * FROM users WHERE username = ?', req.body.username )

    if (isExistUser) {
      res.status(406).send('该用户已被注册')
    } else {
      await db.run(
        'INSERT INTO users (username, password, timestamp, avatar) VALUES (?, ?, ?, ?)',
        req.body.username, req.body.password, Date.now(), req.file.filename)

      res.redirect('/login')
    }
  })

// 登录
app.route('/login')
  .get((req, res, next) => {
    res.render('login.pug')
  })
  .post( async (req, res, next) => {

    let user = await db.get( 
      'SELECT * FROM users WHERE username = ? and password = ?', req.body.username, req.body.password)

    if (user) {
      // console.log('登录成功')
      res.cookie('userId', user.id, {
        signed: true,
      })
      res.redirect('/')
    } else {
      // console.log('登录失败')
      res.status(404).send('username or password was wrong')
    }
  })

// 登出
app.get('/logout', (req, res, next) => {
  res.clearCookie('userId')
  res.redirect('/')
})


// 发送 post 帖子
app.route('/add-post')
  .get((req, res, next) => {
    res.render('add-post.pug')
  })
  .post( async (req, res, next) => {
    // 判断登录状态
    console.log(req.signedCookies)
    let userId = req.signedCookies.userId

    if (userId) {
      await db.run('INSERT INTO posts (userId, title, content, timestamp) VALUES (?, ?, ?, ?)'
        , userId, req.body.title, req.body.content, Date.now())

      let postid = await db.get('SELECT * FROM posts WHERE userId = ? ORDER BY timestamp DESC LIMIT 1', userId)

      res.redirect('/post/' + postid.id)
    } else {
      res.send('you are not logged in!')
    }
  })

// 启动监听，读取数据库
;(async function() {
  db = await dbPromise
  app.listen(port, () => {
    console.log('server is listening on port', port)
  })
}())
