indexTime = time => {
    let t = new Date(time)
    return t.getUTCFullYear() + '/' + (t.getMonth() + 1) + '/' + t.getDate()
   }

document.querySelectorAll(".index-time").forEach(i => {
	let cnt = i.innerHTML
    i.innerHTML = indexTime(Number(cnt))
    i.style.display= 'block'
})