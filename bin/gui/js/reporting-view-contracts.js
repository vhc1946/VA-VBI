
var reptools = require('./reporting-view-tools.js');


var WriteScEOM=(data,month)=>{
  let cont = document.createElement('div');
  cont.classList.add('report-sc-eom-cont');
  let title = document.createElement('div');
  title.appendChild(document.createElement('div')).classList.add('mo-header');
  title.lastChild.innerText = reptools.monthlist[month];
  cont.appendChild(title);
  for(let x=0;x<data.length;x++){
    let sccont = document.createElement('div');
    sccont.classList.add('report-sc-eom-cont');
    sccont.appendChild(reptools.writeCounts(data[x].totals,'TOTALS'));

    for(let t in data[x].types){
      sccont.appendChild(reptools.writeCounts(data[x].typetotals[t],t));
    }
    cont.appendChild(sccont);
  }
  return cont;
}

module.exports={
  WriteScEOM,
}
