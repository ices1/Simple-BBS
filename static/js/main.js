indexTime = time => {
    let t = new Date(time)
    return t.getUTCFullYear() + '/' + (t.getMonth() + 1) + '/' + t.getDate()
   }

postTime = time => {
    let t = new Date(time)
    let click = (String(t)).match(/\d+:\d+/)[0]
    return t.getUTCFullYear() + '/' + (t.getMonth() + 1) + '/' + t.getDate() + ' ' + click
}

document.querySelectorAll(".index-time").forEach(i => {
	let cnt = i.innerHTML
    i.innerHTML = indexTime(Number(cnt))
    i.style.display= 'block'
})

document.querySelectorAll(".post-time").forEach(i => {
	let cnt = i.innerHTML
    i.innerHTML = postTime(Number(cnt))
    i.style.display= 'block'
})