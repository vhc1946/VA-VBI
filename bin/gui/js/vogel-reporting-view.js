const reader = require('xlsx');
const { exec } = require('child_process');
var path = require('path');
var {ObjList} = require('../../repo/tools/box/vg-lists.js');
var lviewcontrol = require('../../repo/gui/js/layouts/loose-view-controller.js');
var vcontrol = require('../../repo/gui/js/layouts/view-controller.js');
var reptools = require('./reporting-view-tools.js');

const { contextIsolated } = require('process');


var depts=['300','350','400','450']
var deptgrps=['dept300','dept350','dept400','dept450']



var techreporting = require('./reporting-view-techs.js');
var woreporting = require('./reporting-view-wos.js');
var cntrctreporting = require('./reporting-view-contracts.js');


var CREATEview=(buttonid,viewid)=>{
  let block = document.createElement('div');
  block.appendChild(CREATEButtonArea(buttonid));
  block.appendChild(GENMonthMenu(viewid));
  return block;
}

var CREATETechView=(buttonid,viewid)=>{
  let block = document.createElement('div');
  block.appendChild(CREATEButtonArea(buttonid));

  block.appendChild(document.createElement('div'));
  block.lastChild.classList.add('report-area-techlayout');
  block.lastChild.appendChild(document.createElement('div'));
  block.lastChild.lastChild.id = 'tech-menu';

  block.lastChild.appendChild(GENMonthMenu(viewid));


  return block;
}


var GENMonthMenu=(viewid)=>{
  let moblock = NEWvcsetup(viewid);
  vcontrol.SETUPviews(moblock,'mt');
  for(let m in reptools.monthlist){
    mocont = document.createElement('div');
    mocont.id = viewid + m;
    vcontrol.ADDview(reptools.monthlist[m],mocont,moblock,false);
    mocont.innerHTML = '';
  }
  return moblock;
}

var NEWvcsetup=(id)=>{
  let vcblock = document.createElement('div');  //Creates new VC Port Setup!
  vcblock.classList.add('viewcontrol-cont');
  vcblock.id = id;
  vcblock.appendChild(document.createElement('div'));
  vcblock.lastChild.classList.add('viewcontrol-menu');
  vcblock.lastChild.appendChild(document.createElement('div'));
  vcblock.appendChild(document.createElement('div'));
  vcblock.lastChild.classList.add('viewcontrol-port');

  return vcblock;
}

var CREATEButtonArea=(buttonid)=>{
  let buttblock = document.createElement('div');
  buttblock.classList.add('report-area-buttons');
  buttblock.appendChild(document.createElement('div'));
  buttblock.lastChild.classList.add('flat-action-button');
  buttblock.lastChild.id = buttonid;
  buttblock.lastChild.innerText = 'Run EOM';
  return buttblock;
}

var SETfilters=()=>{
  let block = document.createElement('div');
  let actblock = block.appendChild(document.createElement('div'));
  actblock.classList.add('report-area-actions')
  actblock.appendChild(document.createElement('input'));
  actblock.lastChild.type = 'date';
  actblock.lastChild.id = 'eom-month';
  let deptblock = actblock.appendChild(document.createElement('div'));
  deptblock.classList.add('report-area-depts');
  deptblock.id = 'dept-nav';
  for(let i in depts){
    deptblock.appendChild(document.createElement('div'));
    deptblock.lastChild.classList.add('flat-action-button','dept'+depts[i]);
    deptblock.lastChild.innerText = depts[i];
    deptblock.lastChild.addEventListener('click',(ele)=>{
      ele.target.classList.toggle('dept-selected');
      let navcont = document.getElementById('dept-nav');
      var selected = FilterSelect(navcont);
      techreporting.GENTechMenu(selected);
      lviewcontrol.SWITCHgroupview(lviewcontrol.GETSelected(navcont,'dept-selected',deptgrps),deptgrps,navcont);
      techreporting.CLEANtechviews();
    });
  }
  return block;
}

var FilterSelect=(cont)=>{
  let departs = [];
  for(let i=0;i<cont.children.length;i++){
    if(cont.children[i].classList.contains('dept-selected')){
      departs.push(cont.children[i].innerText);
    }
  }
  if(departs==''){departs=depts};
  return departs;
}


// Setup Views //
var viewtable = document.getElementById('report-views');
vcontrol.SETUPviews(viewtable,'mt');
vcontrol.ADDview('Service Contracts',CREATEview('runEOM-sc','sc-months'),viewtable,false);
vcontrol.ADDview('Work Orders',CREATEview('runEOM-wo','wo-months'),viewtable,false);
vcontrol.ADDview('Technicians',CREATETechView('runEOM-tech','tech-months'),viewtable,false);
techreporting.SETtechselector();
document.getElementById('report-area-filters').appendChild(SETfilters());

techreporting.GENTechMenu(depts);

// Report Buttons //////////////////////////////////////////////////////////////

document.getElementById('runEOM-sc').addEventListener('click',(ele)=>{
  let rdate = document.getElementById('eom-month').value;
  ipcRenderer.send('runEOM-sc',rdate!=''?new Date(rdate):new Date());
});

document.getElementById('runEOM-wo').addEventListener('click',(ele)=>{
  let rdate = document.getElementById('eom-month').value;
  ipcRenderer.send('runEOM-wo',rdate!=''?new Date(rdate):undefined);
});

document.getElementById('runEOM-tech').addEventListener('click',(ele)=>{
  let rdate = document.getElementById('eom-month').value;
  ipcRenderer.send('update-tech',rdate!=''?new Date(rdate):undefined);
  setTimeout(()=>{
    ipcRenderer.send('runEOM-tech',rdate!=''?new Date(rdate):new Date());
  },2000);
})

////////////////////////////////////////////////////////////////////////////////


// Report Responses ////////////////////////////////////////////////////////////

ipcRenderer.on('setup-contracts',(eve,data)=>{
  console.log('Init Contracts >',data);
  for(let x=0;x<data.length;x++){
    document.getElementById('sc-months'+data[x].month).appendChild(cntrctreporting.WriteScEOM(data[x].data,data[x].month));
  }
});
ipcRenderer.on('setup-wos',(eve,data)=>{
  console.log('Init WOs >',data);
  for(let x=0;x<data.length;x++){
    woreporting.CREATEWoEOM(data[x].data);
  }
});
ipcRenderer.on('setup-techs',(eve,data)=>{
  console.log('Init Techs >',data);
  for(let x=0;x<data.length;x++){
    techreporting.CREATETechEOM(data[x].data,data[x].month);
  }
});


ipcRenderer.on('runEOM-sc',(eve,data,SCEOMfile)=>{
  console.log('SC >',data);
  document.getElementById('sc-months'+data.month).appendChild(cntrctreporting.WriteScEOM(data.data,data.month));
});

ipcRenderer.on('runEOM-wo',(eve,data)=>{
  console.log('WO >',data);
  woreporting.CREATEWoEOM(data);
});

ipcRenderer.on('runEOM-tech',(eve,data)=>{
  console.log('TECHS >',data.data);
  techreporting.CREATETechEOM(data.data,data.month);
});

ipcRenderer.on('update-tech',(eve,data)=>{
  console.log('HAVE UPDATED',data);
});

////////////////////////////////////////////////////////////////////////////////


module.exports={
  CREATEview,
  SETfilters,
}
