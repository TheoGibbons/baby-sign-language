 function timeRemainingCalc(now, start, count, totalCount) {
  const timeElapsed = now - start;
  const timePerItem = timeElapsed / count;
  const remainingItems = totalCount - count;
  const timeRemaining = timePerItem * remainingItems;

  if (timeRemaining < 1000) {
    return '0 secs'
  } else if (timeRemaining < 60000) {
    return Math.round(timeRemaining / 1000) + ' secs'
  } else if (timeRemaining < 3600000) {
    return (Math.round(timeRemaining / 60000) + ' mins') + ' ' + (Math.round((timeRemaining % 60000) / 1000) + ' secs')
  } else {
    return (Math.round(timeRemaining / 3600000) + ' hours') + ' ' + (Math.round((timeRemaining % 3600000) / 60000) + ' mins')
  }
}

 module.exports = { timeRemainingCalc };