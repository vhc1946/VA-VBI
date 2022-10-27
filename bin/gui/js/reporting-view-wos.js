
var reptools = require('./reporting-view-tools.js');


var WriteWoEOM=(data)=>{
  let cont = document.createElement('div');
  cont.appendChild(document.createElement('div'));
  cont.lastChild.classList.add('report-wo-eom-cont', 'dept'+data.dept);
  cont.lastChild.appendChild(document.createElement('div')).innerText = data.dept;
  cont.lastChild.appendChild(reptools.writeCounts(data.totals,'Summary'));//summary container
  cont.lastChild.appendChild(reptools.writeCounts(data.dispatch,'Dispatch'));//summary container
  cont.lastChild.appendChild(reptools.writeCounts(data.time.days.values,'Days'));
  cont.lastChild.appendChild(reptools.writeCostingTable(data.cats,'Categories',true,true));//summary container

  return cont;
}

var CREATEWoEOM=(data)=>{
  let cont = document.getElementById('wo-months'+data.month);
  for(let x=0;x<data.depts.length;x++){
    cont.appendChild(WriteWoEOM(data.depts[x]));
  }
  return cont;
}


module.exports={
  WriteWoEOM,
  CREATEWoEOM
}
