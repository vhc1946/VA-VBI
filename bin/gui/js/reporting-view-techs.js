var {ObjList} = require('../../repo/tools/box/vg-lists.js');
var techlist = new ObjList(require('../../../app/techdb.json'));
var lviewcontrol = require('../../repo/gui/js/layouts/loose-view-controller.js');
var $ = require('jquery');

var FilterSelected=(filtlist)=>{
  let selected = [];
  for(let i=0;i<filtlist.length;i++){
    selected.push('tech'+filtlist[i].user);
  }
  return selected;
}

var filtopts = FilterSelected(techlist.list);

var WriteTechEOM=(data)=>{  //Main write function for displaying Technician data
  let cont = document.createElement('div');
  cont.appendChild(document.createElement('div'));
  cont.lastChild.classList.add('report-tech-eom-cont', 'tech'+data.techuser);
  cont.lastChild.appendChild(document.createElement('div'));
  cont.lastChild.lastChild.classList.add('report-tech-name');
  cont.lastChild.lastChild.innerText = data.techname;

  cont.lastChild.appendChild(writeWOTable(data.worep.two,'Month'));
  cont.lastChild.appendChild(writeComTable(data));
  cont.lastChild.appendChild(writeWOTable(data.worep.trndwo,'Trend'))
  cont.lastChild.appendChild(writeWOTable(data.worep.ytdwo,'YTD'))

  return cont;
}

var writeComTable=(data)=>{   //Writes Commission Table for Technician Tab
  let comblock = document.createElement('div');
  comblock.classList.add('report-comblock');
  comblock.appendChild(document.createElement('div')).classList.add('report-techcom-row');
  comblock.lastChild.appendChild(document.createElement('div')).innerText = 'Category';
  comblock.lastChild.appendChild(document.createElement('div')).innerText = 'Open';
  comblock.lastChild.appendChild(document.createElement('div')).innerText = 'Appr';
  comblock.lastChild.appendChild(document.createElement('div')).innerText = 'Lost';
  comblock.lastChild.appendChild(document.createElement('div')).innerText = 'Paid';
  for(let i in data.commrep.bytype){
    comblock.appendChild(document.createElement('div')).classList.add('report-techcom-row');
    comblock.lastChild.appendChild(document.createElement('div')).innerText = i;
    comblock.lastChild.appendChild(document.createElement('div')).innerText = data.commrep.bytype[i].open;
    comblock.lastChild.appendChild(document.createElement('div')).innerText = data.commrep.bytype[i].approved;
    comblock.lastChild.appendChild(document.createElement('div')).innerText = data.commrep.bytype[i].lost;
    comblock.lastChild.appendChild(document.createElement('div')).innerText = data.commrep.bytype[i].paid;
  }
  comblock.appendChild(document.createElement('div')).classList.add('report-techcom-row');
  comblock.lastChild.appendChild(document.createElement('div')).innerText = 'Submitted: ' + data.commrep.submitted;
  comblock.lastChild.appendChild(document.createElement('div')).innerText = data.commrep.open;
  comblock.lastChild.appendChild(document.createElement('div')).innerText = data.commrep.approved;
  comblock.lastChild.appendChild(document.createElement('div')).innerText = data.commrep.lost;
  comblock.lastChild.appendChild(document.createElement('div')).innerText = data.commrep.paid;
return comblock;
}



var writeWOTable=(data,title)=>{  //Writes WO Table for Technician Tab
  let woblock = document.createElement('div');
  woblock.classList.add('report-woblock');
  woblock.appendChild(document.createElement('div'));
  woblock.lastChild.innerText = title;
  woblock.appendChild(document.createElement('div'));
  woblock.lastChild.innerText = 'Worked';
  woblock.appendChild(document.createElement('div'));
  woblock.lastChild.innerText = 'Revenue';
  woblock.appendChild(document.createElement('div'));
  woblock.lastChild.innerText = 'WOs';
  woblock.appendChild(document.createElement('div'));
  woblock.lastChild.innerText = data.wos;
  woblock.appendChild(document.createElement('div'));
  woblock.lastChild.innerText = data.revpwo.toFixed(2);
  woblock.appendChild(document.createElement('div'));
  woblock.lastChild.innerText = 'Hours';
  woblock.appendChild(document.createElement('div'));
  woblock.lastChild.innerText = data.hours;
  woblock.appendChild(document.createElement('div'));
  woblock.lastChild.innerText = data.revphour.toFixed(2);
  woblock.appendChild(document.createElement('div'));
  woblock.lastChild.innerText = 'Days';
  woblock.appendChild(document.createElement('div'));
  woblock.lastChild.innerText = '';
  woblock.appendChild(document.createElement('div'));
  woblock.lastChild.innerText = data.revpday.toFixed(2);
  woblock.appendChild(document.createElement('div'));
  woblock.lastChild.innerText = 'TOTAL';
  woblock.appendChild(document.createElement('div'));
  woblock.lastChild.innerText = '';
  woblock.appendChild(document.createElement('div'));
  woblock.lastChild.innerText = data.revenue;

  return woblock;
}

var CREATETechEOM=(data,month)=>{  //Main function for creating Technician view
  let cont = document.getElementById('tech-months'+month);
  cont.innerHTML = '';
  for(let x=0;x<data.length;x++){
    cont.appendChild(WriteTechEOM(data[x]));
  }
  return cont;
}

var GENTechMenu=(dselected)=>{  //Generates Technician Menu
  let menublock = document.getElementById('tech-menu');
  menublock.innerHTML = '';
  menublock.appendChild(document.createElement('div'));
  menublock.lastChild.classList.add('report-techmenu-header');
  menublock.lastChild.innerText = 'TECHS';

  let filtlist = techlist.TRIMlist({dept:dselected});

  for(let i=0;i<filtlist.length;i++){
    menublock.appendChild(document.createElement('div'));
    menublock.lastChild.classList.add('flat-action-button','tech'+filtlist[i].user);
    menublock.lastChild.innerText = filtlist[i].user;
    /*
    menublock.lastChild.addEventListener('click',(ele)=>{
      console.log(ele.target)
      ele.target.classList.toggle('opt-selected');
      let navcont = document.getElementById('tech-menu');
      lviewcontrol.SWITCHgroupview(lviewcontrol.GETSelected(navcont,'opt-selected',filtopts),filtopts,navcont);
    });
    */
  }
}

var CLEANtechviews=()=>{lviewcontrol.RESETviews(document.getElementById('tech-menu'),filtopts);}

var SETtechselector=()=>{
  document.getElementById('tech-menu').addEventListener('click',(ele)=>{
    ele.target.classList.toggle('opt-selected');
    lviewcontrol.SWITCHgroupview(lviewcontrol.GETSelected(document.getElementById('tech-menu'),'opt-selected',filtopts),filtopts,document.getElementById('tech-menu'));
  });
}

module.exports={
  WriteTechEOM,
  CREATETechEOM,
  GENTechMenu,
  CLEANtechviews,
  SETtechselector
}
