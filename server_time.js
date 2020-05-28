
function getTimeDiff(address="/timestamp", timeHeader="X-Time", msecHeader="X-Msec"){
  return fetch(address).
    then(response=>{
      let time = Date.now();
      let headers = response.headers;
      let serverTimeHeader = headers.get(timeHeader);
      if(!serverTimeHeader){
        throw new Error('No time in the response');
      }
      let serverTime = new Date(serverTimeHeader);
      let millisHeader = headers.get(msecHeader);
      if(millisHeader){
        let millisSplit = millisHeader.split(".");
        if(millisSplit.length>1){
          let millis = parseInt(millisSplit[1], 10);
          if(!isNaN(millis) && millis<1000 && millis>0){
            serverTime.setUTCMilliseconds(millis);
          }
        }
      }
      return serverTime - time;
    });
}

export {getTimeDiff};
