const $ = require('jquery');
var {ipcRenderer}=require('electron');

var RROOT='../bin/repo/';
var Titlebar = require('../bin/repo/gui/js/modules/vg-titlebar.js');
var {DropNote}=require('../bin/repo/gui/js/modules/vg-poppers.js');
var {navroutes}=require('../bin/routes.js');
var vcontrol = require('../bin/repo/gui/js/layouts/view-controller.js');

var reporting = require('../bin/gui/js/vogel-reporting-view.js');

var techtools = require('../bin/back/tech-reporting.js');

//techtools.UPDATEtechmonth(true).then(result=>{console.log(result)}).catch(err=>{console.log('FAIL')});
//techtools.CLEANtechmonth(8)

//  TITLE BAR //
let mactions={
  getfilters:{
    id:'agreement-reports',
    src:'../bin/repo/assets/icons/trophy.png'
  },
  support:{
    id:'support-ticket',
    src:'../bin/repo/assets/icons/info.png'
  }
}
let qactions={
  refresh:{
    id:'refreshTables',
    src:'../bin/repo/assets/icons/refresh-icon.png'
  }
}

let malist=Titlebar.CREATEactionbuttons(mactions);
let qalist=Titlebar.CREATEactionbuttons(qactions);

Titlebar.ADDmactions(malist);
Titlebar.ADDqactions(qalist);

ipcRenderer.send('setup-contracts','init contracts');
ipcRenderer.send('setup-wos','init wos');
ipcRenderer.send('setup-techs','init techs');

try{
  document.getElementById(Titlebar.tbdom.info.username).innerText = JSON.parse(localStorage.getItem(usersls.curruser)).uname;
}catch{}

document.getElementById(Titlebar.tbdom.title).innerText = 'Vogel Reporting Tool';
document.getElementById('refreshTables').addEventListener('dblclick',(ele)=>{
  ipcRenderer.send('jonas-refresh-tables','Refresh Table')
});
document.getElementById(Titlebar.tbdom.page.user).addEventListener('dblclick',(ele)=>{//GOTO LOGIN
  ipcRenderer.send(navroutes.gotologin,'Opening Login Dash...');
});
document.getElementById(Titlebar.tbdom.page.print).addEventListener('dblclick',(ele)=>{
  ipcRenderer.send('print-screen');
  DropNote('tr','Printing Screen','green');
});
document.getElementById(mactions.getfilters.id).addEventListener('dblclick',(ele)=>{
  ipcRenderer.send('Listcontractfilters','Pass');
})
ipcRenderer.on('Listcontractfilters',(eve,data)=>{
  console.log(data.msg);
})
