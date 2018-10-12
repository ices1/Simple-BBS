
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const sqlite = require('sqlite')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const svgCaptcha = require('svg-captcha');
const dbPromise = sqlite.open('./bbs.db', { Promise });
const upload = multer({dest: path.join(__dirname, 'user-uploaded')})
const port = 3002
const app = express()
let db
let sessions = {}

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

app.use( function sessionMiddleware(req, res, next) {
  // console.log(req.cookies)
  if (!req.cookies.sessionId) {
    res.cookie('sessionId', Math.random().toString(32).slice(2))
  }
  next()
})

app.use( async (req, res, next) => {
  req.user = await db.get('SELECT * FROM users WHERE id = ?', req.signedCookies.userId)
  // console.log(req.user)
  next()
})

// 主页
app.get('/', async (req, res, next) => {
  let posts = await db.all('SELECT posts.*, username, avatar FROM posts JOIN users WHERE posts.userId = users.id')
  res.render('index.pug', {posts, user: req.user})
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
      (SELECT c.* FROM posts JOIN comments c ON posts.id = c.postId WHERE posts.id = ? ) com 
      where userId = users.id`
      , postid)

    // console.log('post: ',post,'comments: ', comments)
    res.render('post.pug',{post,comments, user: req.user})
  } else {
    res.render('page-404.pug', {data :'你来到了知识的荒地 '})
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
    res.render('page-404.pug', {data :'先登录后才可以发评论哦，快来试试吧 ^_^ '})
  }
})


// 个人主页
app.get('/user/:userid', async (req, res, next) => {
  let userid = req.params.userid

  let posts = await db.all(
    'SELECT u.username, p.* from users u join posts p on u.id = p.userId where u.id = ?'
    , userid)  
  let userinfo = await db.get(
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
     userinfo,
     posts,
     comments,
     user: req.user
    })
})

// 注册
app.route('/register')
  .get((req, res, next) => {
    res.render('register.pug', {user: req.user})
    // res.sendfile(path.join(__dirname, './static/register.html'))
  })
  .post(upload.single('avatar'), async (req, res, next) => {
    console.log(req.file)
    console.log(req.body)

    let isExistUser = await db.get( 
      'SELECT * FROM users WHERE username = ?', req.body.username )

    if (isExistUser) {
      res.render('page-404.pug', {data :'这个名字已经被注册咯，换个试试吧 &_& '})
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
    res.render('login.pug', {user: req.user})
  })
  .post( async (req, res, next) => {
    // 返回登录数据
    console.log(req.body)

    if (sessions[req.cookies.sessionId] == req.body.captcha.toLowerCase()) {
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
        res.render('page-404.pug', {data :'登入名、密码错啦, 再蒙一下 ~_~ '})
      }
      
    } else {
      res.render('page-404.pug', {data :'验证码又输错啦, 一定是姿势不对 #_# '})
    }
  })

// 验证码
app.get('/captcha', (req, res, next) => {
  let captcha = svgCaptcha.create({
    color: true,
    noise: 2,
    ignoreChars: '0o1i',
    // background: '#cc9966'
  });
  sessions[req.cookies.sessionId] = captcha.text.toLowerCase()
  console.log('更新写入验证码：', sessions[req.cookies.sessionId])

  res.type('svg'); 
  res.status(200).send(captcha.data);
  next()
})

// 登出
app.get('/logout', (req, res, next) => {
  res.clearCookie('userId')
  res.redirect('/')
})


// 发送 post 帖子
app.route('/add-post')
  .get((req, res, next) => {
    res.render('add-post.pug', {user: req.user})
  })
  .post( async (req, res, next) => {
    // 判断登录状态
    // console.log(req.signedCookies)
    let userId = req.signedCookies.userId

    if (userId) {
      await db.run('INSERT INTO posts (userId, title, content, timestamp) VALUES (?, ?, ?, ?)'
        , userId, req.body.title, req.body.content, Date.now())

      let postid = await db.get('SELECT * FROM posts WHERE userId = ? ORDER BY timestamp DESC LIMIT 1', userId)

      res.redirect('/post/' + postid.id)
    } else {
      res.render('page-404.pug', {data :'请先登录后再发帖，谢谢 ^_^ '})
    }
  })

  // 删除帖子
  app.get('/delete-post/:postid', async (req, res, next) => {
    let postId = req.params.postid
    let post = await db.get('SELECT * FROM posts WHERE id = ?', postId)

    if (req.user.id == post.userId) {
      await db.run('DELETE FROM posts WHERE id = ?', postId)
      res.redirect('/')
    } else {
      res.render('page-404.pug', {data :'您不能删除别人的帖子哦，发个帖子试试吧 ^_^ '})
    }
  })

  // 删除评论
  app.get('/delete-comment/:commentid', async (req, res, next) => {
    let commentId = req.params.commentid
    let comment = await db.get('SELECT * FROM comments WHERE id = ?', commentId)

    if (req.user.id == comment.userId) {
      await db.run('DELETE FROM comments WHERE id = ?', commentId)
      res.redirect('/post/' + comment.postId)
    } else {
      res.render('page-404.pug', {data :'您不能删除别人的评论哦，发个评论试试吧 ^_^ '})
    }
  })

  // 404 page
  app.get('/page-404', (req, res, next) => {
    res.render('page-404.pug', {data :'你来到了知识的荒地 '})
  })

// 启动监听，读取数据库
;(async function() {
  db = await dbPromise
  app.listen(port, () => {
    console.log('server is listening on port', port)
  })
}())
